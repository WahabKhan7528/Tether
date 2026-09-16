'use strict';

const mongoose = require('mongoose');
const SavedReel = require('../models/SavedReel');
const Category = require('../models/Category');
const { createError } = require('../middleware/errorHandler');

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

// GET /api/reels
async function getReels(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const coupleId = req.coupleId;
    const filter = { coupleId };

    if (req.query.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
        return next(createError('Invalid categoryId', 400, 'INVALID_ID'));
      }
      filter.categoryId = new mongoose.Types.ObjectId(req.query.categoryId);
    }

    if (req.query.isDone !== undefined) {
      if (req.query.isDone !== 'true' && req.query.isDone !== 'false') {
        return next(createError('isDone must be true or false', 400, 'VALIDATION_ERROR'));
      }
      filter.isDone = req.query.isDone === 'true';
    }

    const [reels, total] = await Promise.all([
      SavedReel.find(filter)
        .populate('categoryId', 'name icon')
        .populate('savedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SavedReel.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: reels,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/reels
async function createReel(req, res, next) {
  try {
    const { url, platform, caption, note, categoryId } = req.body;
    const coupleId = req.coupleId;

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return next(createError('Invalid categoryId', 400, 'INVALID_ID'));
      }
      const cat = await Category.findOne({ _id: categoryId, coupleId });
      if (!cat) return next(createError('Category not found', 404, 'NOT_FOUND'));
    }

    const reel = await SavedReel.create({
      coupleId: coupleId,
      url: url.trim(),
      platform: platform || 'other',
      caption: caption?.trim() || '',
      note: note?.trim() || '',
      categoryId: categoryId || null,
      savedBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: reel });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/reels/:id
async function updateReel(req, res, next) {
  try {
    const { url, platform, caption, note, isDone, categoryId } = req.body;
    const coupleId = req.coupleId;

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return next(createError('Invalid categoryId', 400, 'INVALID_ID'));
      }
      const cat = await Category.findOne({ _id: categoryId, coupleId });
      if (!cat) return next(createError('Category not found', 404, 'NOT_FOUND'));
    }

    const updates = {};
    if (url !== undefined) updates.url = url.trim();
    if (platform !== undefined) updates.platform = platform;
    if (caption !== undefined) updates.caption = caption.trim();
    if (note !== undefined) updates.note = note.trim();
    if (isDone !== undefined) updates.isDone = Boolean(isDone);
    if (categoryId !== undefined) updates.categoryId = categoryId || null;

    const reel = await SavedReel.findOneAndUpdate(
      { _id: req.params.id, coupleId },
      updates,
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name icon')
      .populate('savedBy', 'name')
      .lean();

    if (!reel) return next(createError('Reel not found', 404, 'NOT_FOUND'));
    return res.json({ success: true, data: reel });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/reels/:id
async function deleteReel(req, res, next) {
  try {
    const coupleId = req.coupleId;
    const reel = await SavedReel.findOneAndDelete({
      _id: req.params.id,
      coupleId,
    });
    if (!reel) return next(createError('Reel not found', 404, 'NOT_FOUND'));
    return res.json({ success: true, data: { message: 'Reel deleted' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getReels, createReel, updateReel, deleteReel };
