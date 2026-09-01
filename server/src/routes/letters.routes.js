'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const letterController = require('../controllers/letterController');
const { authenticate, requirePaired } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/couple');
const validate = require('../middleware/validate');

const VALID_TEMPLATES = ['classic', 'minimal', 'scrapbook', 'elegant', 'vintage'];

// ─── Validators ───────────────────────────────────────────────────────────────

const createLetterValidators = [
  body('title')
    .trim()
    .notEmpty().withMessage('Letter title is required')
    .isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),
  body('templateId')
    .optional()
    .isIn(VALID_TEMPLATES).withMessage(`templateId must be one of: ${VALID_TEMPLATES.join(', ')}`),
  body('content.greeting')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Greeting cannot exceed 120 characters'),
  body('content.body')
    .optional()
    .trim()
    .isLength({ max: 10000 }).withMessage('Letter body cannot exceed 10,000 characters'),
  body('content.closing')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Closing cannot exceed 120 characters'),
];

const updateLetterValidators = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),
  body('templateId')
    .optional()
    .isIn(VALID_TEMPLATES).withMessage(`templateId must be one of: ${VALID_TEMPLATES.join(', ')}`),
  body('content.greeting')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Greeting cannot exceed 120 characters'),
  body('content.body')
    .optional()
    .trim()
    .isLength({ max: 10000 }).withMessage('Letter body cannot exceed 10,000 characters'),
  body('content.closing')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Closing cannot exceed 120 characters'),
];

// ─── Auth guard ───────────────────────────────────────────────────────────────
router.use(authenticate, requirePaired);

// ─── Routes ───────────────────────────────────────────────────────────────────

// IMPORTANT: /slug/:slug must come BEFORE /:id to avoid Mongo ObjectId parse errors
router.get('/slug/:slug', letterController.getLetterBySlug);

router.get('/', letterController.getLetters);
router.post('/', createLetterValidators, validate, letterController.createLetter);

router.get('/:id', validateObjectId('id'), letterController.getLetter);
router.patch('/:id', validateObjectId('id'), updateLetterValidators, validate, letterController.updateLetter);
router.delete('/:id', validateObjectId('id'), letterController.deleteLetter);

module.exports = router;
