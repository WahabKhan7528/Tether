'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoriesController');
const { authenticate, requirePaired } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/couple');
const validate = require('../middleware/validate');

router.use(authenticate, requirePaired);

router.get('/', getCategories);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name is too long'),
    body('icon').optional().trim().isLength({ max: 10 }).withMessage('Icon is too long'),
  ],
  validate,
  createCategory
);

router.patch(
  '/:id',
  validateObjectId('id'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 50 }),
    body('icon').optional().trim().isLength({ max: 10 }),
  ],
  validate,
  updateCategory
);

router.delete('/:id', validateObjectId('id'), deleteCategory);

module.exports = router;
