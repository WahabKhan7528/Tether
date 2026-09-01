'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Attaches a unique request ID to every incoming request.
 * Reads the X-Request-ID header if provided (e.g. from a reverse proxy),
 * otherwise generates a fresh UUID v4.
 *
 * Sets:
 *   req.id             — the request ID string
 *   res header X-Request-ID — echoed back so clients can correlate
 */
function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || uuidv4();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
}

module.exports = requestId;
