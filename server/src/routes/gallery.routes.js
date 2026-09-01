'use strict';

const express = require('express');
const router = express.Router();
const { getGallery, uploadGalleryPhoto, deleteGalleryPhoto } = require('../controllers/galleryController');
const { authenticate, requirePaired } = require('../middleware/auth');
const { validateObjectId }            = require('../middleware/couple');
const { createImageUpload }           = require('../config/multer');

// ─── Multer — local disk upload for gallery photos ────────────────────────────
// Files are saved to: server/uploads/gallery/{coupleId}/{uuid}{ext}
const upload = createImageUpload('gallery', (req) => req.user.coupleId);

// ─── Auth guard ───────────────────────────────────────────────────────────────
router.use(authenticate, requirePaired);

// ─── Routes ───────────────────────────────────────────────────────────────────
router.get('/', getGallery);
router.post('/upload', upload.single('image'), uploadGalleryPhoto);
router.delete('/:id', validateObjectId('id'), deleteGalleryPhoto);

module.exports = router;
