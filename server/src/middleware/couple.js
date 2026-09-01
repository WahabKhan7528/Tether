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
 * Ensure the resource belongs to the authenticated couple.
 * Pass the Mongoose model + the query to locate it.
 *
 * Usage: requireOwnResource(Memory, (req) => ({ _id: req.params.id, coupleId: req.user.coupleId }))
 */
function requireOwnResource(Model, buildQuery) {
  return async (req, res, next) => {
    try {
      const query = buildQuery(req);
      const doc = await Model.findOne(query).lean();
      if (!doc) {
        return next(createError('Resource not found', 404, 'NOT_FOUND'));
      }
      req.resource = doc;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validateObjectId, requireOwnResource };
