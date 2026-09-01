'use strict';

const fs = require('fs');
const path = require('path');
const Memory = require('../models/Memory');
const GalleryPhoto = require('../models/GalleryPhoto');
const { imageStorage } = require('../services/storage');
const { createError } = require('../middleware/errorHandler');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// ─── GET /api/gallery ─────────────────────────────────────────────────────────
// Returns a merged, date-sorted list of Memory images + GalleryPhoto documents.
// Each item carries a `source` field: 'memory' | 'gallery'.
// Supports pagination via ?page=1&limit=30.

async function getGallery(req, res, next) {
  try {
    const coupleId = req.user.coupleId;
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
    const skip     = (page - 1) * limit;

    // ── Fetch both sources in parallel, sorted at DB level ───────────────────
    // We over-fetch slightly to interleave correctly; a proper cursor-based
    // approach would require a unified collection. For the current scale (couples
    // with <500 photos each) this is fast and correct.
    const [memories, galleryPhotos, totalMemoryDocs, totalGallery] = await Promise.all([
      Memory.find({ coupleId, 'images.0': { $exists: true } })
        .select('title dateTaken location images createdAt')
        .sort({ createdAt: -1 })
        .lean(),

      GalleryPhoto.find({ coupleId })
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .lean(),

      Memory.countDocuments({ coupleId, 'images.0': { $exists: true } }),
      GalleryPhoto.countDocuments({ coupleId }),
    ]);

    // ── Flatten memory images ─────────────────────────────────────────────────
    const memoryImages = [];
    memories.forEach((memory) => {
      memory.images.forEach((image) => {
        memoryImages.push({
          _id:       image._id,
          url:       image.url,
          key:       image.key,
          order:     image.order,
          source:    'memory',
          memoryId:  memory._id,
          title:     memory.title,
          caption:   '',
          dateTaken: memory.dateTaken,
          location:  memory.location,
          coordinates: memory.coordinates,
          createdAt: memory.createdAt,
        });
      });
    });

    const galleryItems = galleryPhotos.map((photo) => ({
      _id:        photo._id,
      url:        photo.url,
      key:        photo.key,
      source:     'gallery',
      memoryId:   null,
      title:      photo.title,
      caption:    photo.caption,
      dateTaken:  photo.dateTaken,
      location:   photo.location,
      coordinates: photo.coordinates,
      uploadedBy: photo.uploadedBy,
      createdAt:  photo.createdAt,
    }));

    // ── Merge, sort, paginate ─────────────────────────────────────────────────
    const allImages = [...memoryImages, ...galleryItems]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total      = allImages.length;
    const paginated  = allImages.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data:    paginated,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/gallery/upload  (STORAGE_MODE=local) ──────────────────────────
// Multer processes the file before this handler runs.

async function uploadGalleryPhoto(req, res, next) {
  try {
    if (!req.file) {
      return next(createError('No file provided', 400, 'VALIDATION_ERROR'));
    }

    const { title = '', caption = '', dateTaken, location = '' } = req.body;
    let coordinates = { lat: null, lng: null };
    if (req.body.coordinates) {
      try {
        coordinates = typeof req.body.coordinates === 'string' 
          ? JSON.parse(req.body.coordinates) 
          : req.body.coordinates;
      } catch (e) { }
    }

    const key = `gallery/${req.user.coupleId}/${req.file.filename}`;
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const url = `${serverUrl}/uploads/${key}`;

    const photo = await GalleryPhoto.create({
      coupleId: req.user.coupleId,
      uploadedBy: req.user._id,
      url,
      key,
      title: title.trim(),
      caption: caption.trim(),
      dateTaken: dateTaken ? new Date(dateTaken) : null,
      location: location.trim(),
      coordinates,
    });

    return res.status(201).json({ success: true, data: photo });
  } catch (err) {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(err);
  }
}

// ─── DELETE /api/gallery/:id ──────────────────────────────────────────────────
// Only gallery-source photos can be deleted this way.

async function deleteGalleryPhoto(req, res, next) {
  try {
    const photo = await GalleryPhoto.findOneAndDelete({
      _id: req.params.id,
      coupleId: req.user.coupleId,
    });

    if (!photo) {
      return next(createError('Photo not found', 404, 'NOT_FOUND'));
    }

    // Best-effort file cleanup
    await imageStorage.deleteFiles([photo.key]);

    return res.json({ success: true, data: { message: 'Photo deleted' } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGallery,
  uploadGalleryPhoto,
  deleteGalleryPhoto,
};
