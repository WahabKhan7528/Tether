'use strict';

const express = require('express');
const router = express.Router();
const { getTodayPrompt, answerPrompt } = require('../controllers/promptsController');
const { authenticate, requirePaired } = require('../middleware/auth');

router.use(authenticate, requirePaired);

router.get('/today', getTodayPrompt);
router.post('/today', answerPrompt);

module.exports = router;
