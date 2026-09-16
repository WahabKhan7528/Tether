'use strict';

const mongoose = require('mongoose');
const { createError } = require('./errorHandler');

/**
 * Validate that :id param is a valid MongoDB ObjectId.
 */
function validateObjectId(param = 'id') {
  return (req, res, next) => {
    const id = req.params[param];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createError('Invalid ID', 400, 'INVALID_ID'));
    }
    next();
  };
}

/**
 * Asserts req.user has a coupleId, and extracts it as a proper ObjectId.
 * Attaches req.coupleId for use in controllers.
 */
function extractCoupleId(req, res, next) {
  const raw = req.user.coupleId?._id || req.user.coupleId;
  if (!raw) return next(createError('You must be paired.', 403, 'NOT_PAIRED'));
  req.coupleId = new mongoose.Types.ObjectId(raw);
  next();
}

module.exports = { validateObjectId, extractCoupleId };
