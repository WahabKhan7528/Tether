'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  signup,
  login,
  refresh,
  logout,
  me,
  updateMe,
  updatePartner,
  changePassword,
  completeOnboarding,
  uploadAvatar,
  avatarUpload,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// ─── Validators ───────────────────────────────────────────────────────────────

const signupValidators = [
  // User
  body('name').trim().notEmpty().withMessage('Your name is required').isLength({ max: 60 }).withMessage('Name is too long'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  // Optional
  body('inviteCode').optional({ nullable: true }).trim().isString().withMessage('Invite code must be a string'),
];

const loginValidators = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateMeValidators = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 60 }),
  body('nickname').optional().trim().isLength({ max: 40 }).withMessage('Nickname too long'),
  body('gender').optional({ nullable: true }).isIn(['boy', 'girl', null]).withMessage('Invalid gender value'),
  body('dateOfBirth').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  body('bio').optional().trim().isLength({ max: 160 }).withMessage('Bio cannot exceed 160 characters'),
  body('favouriteColour').optional().trim().isLength({ max: 30 }).withMessage('Colour value too long'),
  body('partnerKnowledge').optional().isArray().withMessage('Must be an array'),
  body('currentStatus')
    .optional()
    .isIn(['happy', 'sad', 'busy', 'sleeping'])
    .withMessage('currentStatus must be one of: happy, sad, busy, sleeping'),
];

const updatePartnerValidators = [
  body('nickname').optional().trim().isLength({ max: 40 }).withMessage('Nickname too long'),
];

const changePasswordValidators = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

const onboardingValidators = [
  body('nickname').optional().trim().isLength({ max: 40 }).withMessage('Nickname too long'),
  body('gender').optional({ nullable: true }).isIn(['boy', 'girl', null]).withMessage('Invalid gender'),
  body('dateOfBirth').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  body('bio').optional().trim().isLength({ max: 160 }).withMessage('Bio too long'),
  body('favouriteColour').optional().trim().isLength({ max: 30 }).withMessage('Colour value too long'),
];

// ─── Public routes ────────────────────────────────────────────────────────────
router.post('/signup', signupValidators, validate, signup);
router.post('/login', loginValidators, validate, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// ─── Protected routes (require valid session cookie) ─────────────────────────
router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateMeValidators, validate, updateMe);
router.patch('/partner', authenticate, updatePartnerValidators, validate, updatePartner);
router.post('/me/avatar', authenticate, avatarUpload.single('avatar'), uploadAvatar);
router.post('/change-password', authenticate, changePasswordValidators, validate, changePassword);
router.post('/onboarding', authenticate, onboardingValidators, validate, completeOnboarding);

module.exports = router;
