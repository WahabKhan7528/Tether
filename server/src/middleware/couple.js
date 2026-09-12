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

module.exports = { validateObjectId };
