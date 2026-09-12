'use strict';

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Memory = require('../models/Memory');
const Category = require('../models/Category');
const { imageStorage } = require('../services/storage');
const { createError } = require('../middleware/errorHandler');

// Absolute path to server/uploads/ — used for local upload key construction
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

// ─── GET /api/memories ────────────────────────────────────────────────────────

async function getMemories(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const filter = { coupleId };

    if (req.query.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
        return next(createError('Invalid categoryId', 400, 'INVALID_ID'));
      }
      filter.categoryId = req.query.categoryId;
    }

    const [memories, total] = await Promise.all([
      Memory.find(filter)
        .populate('categoryId', 'name icon')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Memory.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: memories,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/memories/:id ────────────────────────────────────────────────────

async function getMemory(req, res, next) {
  try {
    const memory = await Memory.findOne({
      _id: req.params.id,
      coupleId: req.user.coupleId,
    })
      .populate('categoryId', 'name icon')
      .populate('createdBy', 'name')
      .lean();

    if (!memory) return next(createError('Memory not found', 404, 'NOT_FOUND'));
    return res.json({ success: true, data: memory });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/memories ───────────────────────────────────────────────────────

async function createMemory(req, res, next) {
  try {
    const { title, description, dateTaken, location, categoryId, coordinates } = req.body;

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return next(createError('Invalid categoryId', 400, 'INVALID_ID'));
      }
      const cat = await Category.findOne({ _id: categoryId, coupleId: req.user.coupleId });
      if (!cat) return next(createError('Category not found', 404, 'NOT_FOUND'));
    }

    const memory = await Memory.create({
      coupleId: req.user.coupleId,
      title: title.trim(),
      description: description?.trim() || '',
      dateTaken: dateTaken ? new Date(dateTaken) : null,
      location: location?.trim() || '',
      coordinates: coordinates || { lat: null, lng: null },
      categoryId: categoryId || null,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: memory });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/memories/:id ──────────────────────────────────────────────────

async function updateMemory(req, res, next) {
  try {
    const { title, description, dateTaken, location, categoryId, coordinates } = req.body;
    // NOTE: 'images' is intentionally excluded — image management uses dedicated
    // upload endpoints (localUpload / presignUpload + confirmUpload).

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return next(createError('Invalid categoryId', 400, 'INVALID_ID'));
      }
      const cat = await Category.findOne({ _id: categoryId, coupleId: req.user.coupleId });
      if (!cat) return next(createError('Category not found', 404, 'NOT_FOUND'));
    }

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (dateTaken !== undefined) updates.dateTaken = dateTaken ? new Date(dateTaken) : null;
    if (location !== undefined) updates.location = location.trim();
    if (coordinates !== undefined) updates.coordinates = coordinates;
    if (categoryId !== undefined) updates.categoryId = categoryId || null;
    // images is NOT allowed here

    const memory = await Memory.findOneAndUpdate(
      { _id: req.params.id, coupleId: req.user.coupleId },
      updates,
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name icon')
      .populate('createdBy', 'name');

    if (!memory) return next(createError('Memory not found', 404, 'NOT_FOUND'));
    return res.json({ success: true, data: memory });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/memories/:id ─────────────────────────────────────────────────

async function deleteMemory(req, res, next) {
  try {
    const memory = await Memory.findOneAndDelete({
      _id: req.params.id,
      coupleId: req.user.coupleId,
    });
    if (!memory) return next(createError('Memory not found', 404, 'NOT_FOUND'));

    // Best-effort storage cleanup
    if (imageStorage) {
      imageStorage.deleteFiles(memory.images.map((img) => img.key || img.fileId));
    }

    return res.json({ success: true, data: { message: 'Memory deleted' } });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/memories/:id/images ───────────────────────────────────────────
//
// Browser sends the image as multipart/form-data.
// Multer (configured in routes/memories.js) saves the file to disk before this handler runs.
// This handler validates ownership, builds the metadata, and persists it.

async function localUpload(req, res, next) {
  try {
    if (!req.file) {
      return next(createError('No file provided', 400, 'VALIDATION_ERROR'));
    }

    // Verify memory ownership before attaching the image
    const memory = await Memory.findOne({
      _id: req.params.id,
      coupleId: req.user.coupleId,
    });

    if (!memory) {
      // Remove the orphaned file from disk
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return next(createError('Memory not found', 404, 'NOT_FOUND'));
    }

    // Key is relative to UPLOADS_DIR: memories/{memoryId}/{filename}
    const key = `memories/${req.params.id}/${req.file.filename}`;
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const url = `${serverUrl}/uploads/${key}`;
    const order = req.body.order !== undefined ? parseInt(req.body.order) : memory.images.length;

    memory.images.push({ url, key, order });
    await memory.save();

    return res.status(201).json({ success: true, data: memory });
  } catch (err) {
    // Best-effort cleanup on unexpected errors
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(err);
  }
}

module.exports = {
  getMemories,
  getMemory,
  createMemory,
  updateMemory,
  deleteMemory,
  localUpload,
};
