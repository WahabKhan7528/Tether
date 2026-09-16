'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getGallery, uploadGalleryPhoto, deleteGalleryPhoto } = require('../controllers/galleryController');
const { authenticate, requirePaired } = require('../middleware/auth');
const { validateObjectId }            = require('../middleware/couple');
const { createImageUpload }           = require('../config/multer');
const validate                        = require('../middleware/validate');

// ─── Multer — local disk upload for gallery photos ────────────────────────────
// Files are saved to: server/uploads/gallery/{coupleId}/{uuid}{ext}
const upload = createImageUpload('gallery', (req) => req.user.coupleId);

// ─── Auth guard ───────────────────────────────────────────────────────────────
router.use(authenticate, requirePaired);

// ─── Routes ───────────────────────────────────────────────────────────────────
router.get('/', getGallery);

// Validate optional metadata fields submitted alongside the image
router.post(
  '/upload',
  upload.single('image'),
  [
    body('title').optional().trim().isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),
    body('caption').optional().trim().isLength({ max: 300 }).withMessage('Caption cannot exceed 300 characters'),
    body('location').optional().trim().isLength({ max: 120 }).withMessage('Location too long'),
    body('dateTaken').optional({ nullable: true }).isISO8601().withMessage('dateTaken must be a valid ISO date'),
  ],
  validate,
  uploadGalleryPhoto
);

router.delete('/:id', validateObjectId('id'), deleteGalleryPhoto);

module.exports = router;
