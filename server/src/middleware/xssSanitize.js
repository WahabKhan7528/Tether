'use strict';

/**
 * XSS sanitization middleware.
 *
 * Purpose: Prevents Stored XSS attacks by stripping or escaping HTML tags
 * from string fields in req.body before they reach controllers.
 *
 * Why this matters for Tether:
 *   - LetterPages: Users write rich text (greeting, body, closing). If this
 *     content were saved raw and later rendered via innerHTML or a template
 *     engine, a stored XSS payload like <script>...</script> could execute in
 *     the victim's browser.
 *   - User profile fields (bio, nickname, name): Displayed in the UI. Malicious
 *     HTML could break layout or execute scripts.
 *
 * Implementation:
 *   We use a simple, dependency-free recursive sanitizer that escapes the five
 *   critical HTML characters (<, >, ", ', &) in all string values recursively.
 *   This is sufficient for a REST API that does not intentionally render HTML
 *   and relies on React's JSX auto-escaping on the client.
 *
 * Note: This middleware sanitizes req.body ONLY. URL params and query strings
 * are already handled by express-validator in each route, and MongoDB operators
 * are stripped by express-mongo-sanitize.
 */

const HTML_ESCAPE_MAP = {
  '&':  '&amp;',
  '<':  '&lt;',
  '>':  '&gt;',
  '"':  '&quot;',
  "'":  '&#x27;',
  '/':  '&#x2F;',
};

/**
 * Recursively escapes HTML characters in all string values of an object or array.
 * Non-string primitives (numbers, booleans, null) are returned unchanged.
 *
 * @param {*} value - Any JS value
 * @returns {*} The sanitized value
 */
function escapeHtml(value) {
  if (typeof value === 'string') {
    return value.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char]);
  }

  if (Array.isArray(value)) {
    return value.map(escapeHtml);
  }

  if (value !== null && typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = escapeHtml(val);
    }
    return sanitized;
  }

  // Primitives (number, boolean, null, undefined) — unchanged
  return value;
}

/**
 * Express middleware that HTML-escapes all string values in req.body.
 * Safe to use with any JSON or URL-encoded body.
 */
function xssSanitize(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = escapeHtml(req.body);
  }
  next();
}

module.exports = xssSanitize;
