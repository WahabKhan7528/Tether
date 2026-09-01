'use strict';

const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const {
  getMemories,
  getMemory,
  createMemory,
  updateMemory,
  deleteMemory,
  localUpload,
} = require('../controllers/memoriesController');
const { authenticate, requirePaired } = require('../middleware/auth');
const { validateObjectId }            = require('../middleware/couple');
const validate                        = require('../middleware/validate');
const { createImageUpload }           = require('../config/multer');

// ─── Multer — local disk upload (STORAGE_MODE=local) ──────────────────────────
// Files are saved to: server/uploads/memories/{memoryId}/{uuid}{ext}
const upload = createImageUpload('memories', (req) => req.params.id);

// ─── Auth guard applied to all routes ─────────────────────────────────────────
router.use(authenticate, requirePaired);

// ─── Standard CRUD ────────────────────────────────────────────────────────────
router.get('/', getMemories);
router.get('/:id', validateObjectId('id'), getMemory);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('location').optional().trim().isLength({ max: 120 }),
    body('coordinates.lat').optional({ nullable: true }).isNumeric(),
    body('coordinates.lng').optional({ nullable: true }).isNumeric(),
    body('dateTaken').optional().isISO8601().withMessage('dateTaken must be a valid date'),
  ],
  validate,
  createMemory
);

router.patch(
  '/:id',
  validateObjectId('id'),
  [
    body('title').optional().trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('location').optional().trim().isLength({ max: 120 }),
    body('coordinates.lat').optional({ nullable: true }).isNumeric(),
    body('coordinates.lng').optional({ nullable: true }).isNumeric(),
    body('dateTaken').optional().isISO8601().withMessage('dateTaken must be a valid date'),
    // NOTE: 'images' is intentionally excluded — image management uses dedicated upload endpoints
  ],
  validate,
  updateMemory
);

router.delete('/:id', validateObjectId('id'), deleteMemory);

// ─── Image upload: local mode (STORAGE_MODE=local) ────────────────────────────
// POST /api/memories/:id/images — multipart/form-data with field "image"
router.post(
  '/:id/images',
  validateObjectId('id'),
  upload.single('image'),
  localUpload
);



module.exports = router;
