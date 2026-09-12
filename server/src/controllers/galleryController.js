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

    const pipeline = [
      // 1. Start with GalleryPhoto
      { $match: { coupleId: coupleId } },
      { $project: {
          url: 1, key: 1, title: 1, caption: 1, dateTaken: 1,
          location: 1, coordinates: 1, uploadedBy: 1, createdAt: 1,
          source: { $literal: 'gallery' }, memoryId: { $literal: null }
        }
      },
      // 2. Union with Memories that have images
      { $unionWith: {
          coll: 'memories',
          pipeline: [
            { $match: { coupleId: coupleId, 'images.0': { $exists: true } } },
            // Unwind images to get one document per image
            { $unwind: '$images' },
            { $project: {
                _id: '$images._id', url: '$images.url', key: '$images.key',
                order: '$images.order', source: { $literal: 'memory' },
                memoryId: '$_id', title: 1, caption: { $literal: '' },
                dateTaken: 1, location: 1, coordinates: 1, createdAt: 1
              }
            }
          ]
        }
      },
      // 3. Facet for paginated data and total count
      { $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const result = await GalleryPhoto.aggregate(pipeline);
    const paginated = result[0].data;
    const total = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;
    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data: paginated,
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
