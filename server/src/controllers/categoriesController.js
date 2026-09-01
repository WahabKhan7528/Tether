'use strict';

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Memory = require('../models/Memory');
const SavedReel = require('../models/SavedReel');
const { createError } = require('../middleware/errorHandler');

// GET /api/categories
async function getCategories(req, res, next) {
  try {
    const coupleId = req.user.coupleId?._id || req.user.coupleId;

    // ── 4 queries total, regardless of number of categories ──────────────────
    const [categories, memoryCounts, reelCounts, thumbnails] = await Promise.all([
      // 1. All categories for this couple
      Category.find({ coupleId }).sort({ createdAt: -1 }).lean(),

      // 2. Memory count per category (aggregate)
      Memory.aggregate([
        { $match: { coupleId: new mongoose.Types.ObjectId(coupleId) } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ]),

      // 3. Saved reel count per category (aggregate)
      SavedReel.aggregate([
        { $match: { coupleId: new mongoose.Types.ObjectId(coupleId) } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ]),

      // 4. Most recent memory with at least one image per category
      Memory.aggregate([
        { $match: { coupleId: new mongoose.Types.ObjectId(coupleId), 'images.0': { $exists: true } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$categoryId', thumbnail: { $first: { $arrayElemAt: ['$images', 0] } } } },
      ]),
    ]);

    // ── Build lookup maps ─────────────────────────────────────────────────────
    const memoryCountMap  = Object.fromEntries(memoryCounts.map((r) => [String(r._id), r.count]));
    const reelCountMap    = Object.fromEntries(reelCounts.map((r) => [String(r._id), r.count]));
    const thumbnailMap    = Object.fromEntries(thumbnails.map((r) => [String(r._id), r.thumbnail]));

    const enrichedCategories = categories.map((cat) => ({
      ...cat,
      memoryCount: memoryCountMap[String(cat._id)] || 0,
      reelCount:   reelCountMap[String(cat._id)]   || 0,
      thumbnail:   thumbnailMap[String(cat._id)]   || null,
    }));

    return res.json({ success: true, data: enrichedCategories });
  } catch (err) {
    next(err);
  }
}

// POST /api/categories
async function createCategory(req, res, next) {
  try {
    const { name, icon } = req.body;
    const category = await Category.create({
      coupleId: req.user.coupleId,
      name: name.trim(),
      icon: icon?.trim() || '📁',
    });
    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/categories/:id
async function updateCategory(req, res, next) {
  try {
    const { name, icon } = req.body;
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, coupleId: req.user.coupleId },
      { ...(name && { name: name.trim() }), ...(icon !== undefined && { icon: icon.trim() }) },
      { new: true, runValidators: true }
    );
    if (!category) return next(createError('Category not found', 404, 'NOT_FOUND'));
    return res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/categories/:id
async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      coupleId: req.user.coupleId,
    });
    if (!category) return next(createError('Category not found', 404, 'NOT_FOUND'));

    // Null-out categoryId on associated content (do not delete)
    await Memory.updateMany({ coupleId: req.user.coupleId, categoryId: req.params.id }, { categoryId: null });
    await SavedReel.updateMany({ coupleId: req.user.coupleId, categoryId: req.params.id }, { categoryId: null });

    return res.json({ success: true, data: { message: 'Category deleted' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
