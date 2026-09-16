'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getMyCouple,
  updateCouple,
  joinCouple,
  addMilestone,
  deleteMilestone,
  addBucketListItem,
  toggleBucketListItem,
  deleteBucketListItem,
  addDateIdea,
  deleteDateIdea,
} = require('../controllers/couplesController');
const { authenticate, requirePaired } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateObjectId } = require('../middleware/couple');
router.use(authenticate);
// ─── Validators ───────────────────────────────────────────────────────────────

const updateCoupleValidators = [
  body('coupleNickname').optional().trim().isLength({ max: 60 }).withMessage('Couple nickname too long'),
  body('anniversaryDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  body('relationshipStatus').optional().trim().isLength({ max: 40 }).withMessage('Relationship status too long'),
  body('coupleBio').optional().trim().isLength({ max: 200 }).withMessage('Couple bio too long'),
  // Validate themeSong as a URL so arbitrary script payloads can't be stored
  body('themeSong')
    .optional({ nullable: true })
    .trim()
    .isURL({ require_protocol: true }).withMessage('themeSong must be a valid URL')
    .isLength({ max: 500 }).withMessage('themeSong URL too long'),
];

const joinCoupleValidators = [
  body('inviteCode')
    .trim()
    .notEmpty().withMessage('Invite code is required')
    .isLength({ min: 6, max: 12 }).withMessage('Invalid invite code'),
];

const milestoneValidators = [
  body('title').trim().notEmpty().withMessage('Milestone title is required').isLength({ max: 120 }),
  body('date').isISO8601().withMessage('A valid date is required'),
  body('description').optional().trim().isLength({ max: 300 }),
];

const bucketListValidators = [
  body('title').trim().notEmpty().withMessage('Bucket list item title is required').isLength({ max: 120 }),
];

const dateIdeaValidators = [
  body('title').trim().notEmpty().withMessage('Idea title is required').isLength({ max: 120 }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// Get couple info (works even when not yet paired — returns { isPaired: false })
router.get('/me', getMyCouple);

// Join an existing couple via invite code (authenticated user without a coupleId)
router.post('/join', joinCoupleValidators, validate, joinCouple);

// The routes below require being fully paired
router.patch('/me', requirePaired, updateCoupleValidators, validate, updateCouple);

// ─── Milestones sub-resource ──────────────────────────────────────────────────
router.post('/me/milestones', requirePaired, milestoneValidators, validate, addMilestone);
router.delete('/me/milestones/:itemId', requirePaired, validateObjectId('itemId'), deleteMilestone);

// ─── Bucket list sub-resource ─────────────────────────────────────────────────
router.post('/me/bucket-list', requirePaired, bucketListValidators, validate, addBucketListItem);
router.patch('/me/bucket-list/:itemId', requirePaired, validateObjectId('itemId'), toggleBucketListItem);
router.delete('/me/bucket-list/:itemId', requirePaired, validateObjectId('itemId'), deleteBucketListItem);

// ─── Date Ideas sub-resource ──────────────────────────────────────────────────
router.post('/me/date-ideas', requirePaired, dateIdeaValidators, validate, addDateIdea);
router.delete('/me/date-ideas/:itemId', requirePaired, validateObjectId('itemId'), deleteDateIdea);

module.exports = router;
