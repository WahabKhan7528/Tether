'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate, requirePaired } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/couple');
const { createAudioUpload } = require('../config/multer');
const radyoController = require('../controllers/radyoController');
const validate = require('../middleware/validate');

// All radyo routes require auth and couple
router.use(authenticate, requirePaired);

const upload = createAudioUpload('radyo', (req) => req.user.coupleId);

router.get('/', radyoController.getTracks);
router.get('/stream/:id', validateObjectId('id'), radyoController.streamTrack);

// Validate metadata fields on upload to prevent oversized or malicious content
router.post(
  '/upload',
  upload.single('audio'),
  [
    body('title').optional().trim().isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),
    body('artist').optional().trim().isLength({ max: 80 }).withMessage('Artist cannot exceed 80 characters'),
  ],
  validate,
  radyoController.uploadTrack
);

router.delete('/:id', validateObjectId('id'), radyoController.deleteTrack);

module.exports = router;
