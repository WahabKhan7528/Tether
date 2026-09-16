'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getTodayPrompt, answerPrompt } = require('../controllers/promptsController');
const { authenticate, requirePaired } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate, requirePaired);

router.get('/today', getTodayPrompt);

// Validate the answer payload — prevents excessively long or malformed content
router.post(
  '/today',
  [
    body('answer')
      .trim()
      .notEmpty().withMessage('Answer cannot be empty')
      .isLength({ max: 500 }).withMessage('Answer cannot exceed 500 characters'),
  ],
  validate,
  answerPrompt
);

module.exports = router;
