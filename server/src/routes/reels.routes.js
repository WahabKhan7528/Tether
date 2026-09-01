'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getReels, createReel, updateReel, deleteReel } = require('../controllers/reelsController');
const { authenticate, requirePaired } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/couple');
const validate = require('../middleware/validate');

router.use(authenticate, requirePaired);

router.get('/', getReels);

router.post(
  '/',
  [
    body('url').trim().notEmpty().withMessage('URL is required').isURL({ require_protocol: true }).withMessage('Must be a valid URL').isLength({ max: 2048 }),
    body('platform').optional().isIn(['instagram', 'tiktok', 'other']).withMessage('Platform must be instagram, tiktok, or other'),
    body('caption').optional().trim().isLength({ max: 300 }),
    body('note').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  createReel
);

router.patch(
  '/:id',
  validateObjectId('id'),
  [
    body('url').optional().trim().isURL({ require_protocol: true }).withMessage('Must be a valid URL').isLength({ max: 2048 }),
    body('platform').optional().isIn(['instagram', 'tiktok', 'other']),
    body('caption').optional().trim().isLength({ max: 300 }),
    body('note').optional().trim().isLength({ max: 500 }),
    body('isDone').optional().isBoolean().withMessage('isDone must be a boolean'),
  ],
  validate,
  updateReel
);

router.delete('/:id', validateObjectId('id'), deleteReel);

module.exports = router;
