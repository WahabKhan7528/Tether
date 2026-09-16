'use strict';

const { v4: uuidv4 } = require('uuid');

// ─── Request ID header validation ─────────────────────────────────────────────
// Only accept an X-Request-ID from upstream if it looks like a valid UUID v4
// or an alphanumeric trace ID (e.g., from a reverse proxy or load balancer).
// This prevents log-injection attacks where an attacker forges a malicious
// request ID that pollutes log files or log aggregators.
const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-]{8,64}$/;

/**
 * Attaches a unique request ID to every incoming request.
 *
 * Reads the X-Request-ID header if provided by a trusted upstream (e.g., nginx,
 * Render, AWS ALB) and passes strict format validation. Otherwise generates a
 * fresh UUID v4. Echoes the ID back in the X-Request-ID response header so
 * clients can correlate requests across logs.
 *
 * Security: Validates the incoming header value before using it to prevent
 * log-injection or header-poisoning attacks.
 */
function requestId(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const id = (incomingId && SAFE_ID_REGEX.test(incomingId))
    ? incomingId
    : uuidv4();

  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
}

module.exports = requestId;
