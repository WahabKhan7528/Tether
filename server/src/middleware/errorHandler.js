'use strict';

/**
 * Centralized error handler middleware.
 * Must be registered LAST in Express.
 */
function errorHandler(err, req, res, next) {
  // Don't log sensitive info
  const isDev = process.env.NODE_ENV !== 'production';

  // Multer file upload errors
  if (err.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? `File too large. Maximum size is 10MB.`
      : `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, message: msg, code: 'UPLOAD_ERROR' });
  }
  if (err.code === 'UPLOAD_NOT_ALLOWED') {
    return res.status(400).json({ success: false, message: err.message, code: 'UPLOAD_NOT_ALLOWED' });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Validation error',
      code: 'VALIDATION_ERROR',
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const code = field === 'email' ? 'EMAIL_ALREADY_EXISTS' : 'DUPLICATE_VALUE';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code,
    });
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      code: 'INVALID_ID',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'UNAUTHORIZED',
    });
  }

  // Application errors (thrown with statusCode)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code || 'ERROR',
    });
  }

  // Unknown errors — don't expose internals in production
  console.error('[Tether] Unhandled error:', isDev ? err : err.message);

  return res.status(500).json({
    success: false,
    message: isDev ? err.message : 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    stack: isDev ? err.stack : undefined,
  });
}

/**
 * Helper to create structured application errors.
 */
function createError(message, statusCode = 500, code = 'ERROR') {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

module.exports = { errorHandler, createError };
