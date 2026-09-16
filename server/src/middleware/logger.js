'use strict';

/**
 * Structured HTTP request logger.
 *
 * In development : uses a simple readable format via pino-pretty
 * In production  : uses pino-http for JSON structured logging
 *
 * ── Security Practices ───────────────────────────────────────────────────────
 * Sensitive fields are actively REDACTED before any log entry is written.
 * This prevents credentials, tokens, and PII from appearing in:
 *   - Local development consoles
 *   - Log aggregators (Datadog, CloudWatch, etc.)
 *   - Log-based alerting and debugging systems
 *
 * Redacted fields:
 *   - req.headers.authorization (Bearer token)
 *   - req.headers.cookie        (contains accessToken, refreshToken, CSRF cookie)
 *   - req.body.password         (login/signup payloads)
 *   - req.body.currentPassword  (change-password payload)
 *   - req.body.newPassword      (change-password payload)
 *   - req.body.inviteCode       (couple join codes — semi-sensitive)
 */

const isDev = process.env.NODE_ENV !== 'production';

const pino = require('pino');
const pinoHttp = require('pino-http');

// ─── Sensitive field paths to redact from all log output ─────────────────────
// Pino uses dot-notation paths. Wildcard '*' is supported for nested objects.
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.inviteCode',
  // Also redact the CSRF token header in case it appears in logs
  'req.headers["x-csrf-token"]',
];

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  // Redact sensitive fields across all log output
  redact: {
    paths:  REDACT_PATHS,
    censor: '[REDACTED]',
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
      }
    : undefined,
});

const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id, // use our requestId middleware value
  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage(req, res, err) {
    return `${req.method} ${req.url} ${res.statusCode} — ${err.message}`;
  },
  serializers: {
    req(req) {
      // Only serialize safe, non-sensitive request fields
      return {
        id:     req.id,
        method: req.method,
        url:    req.url,
        // Include User-Agent for debugging client issues, but never auth headers
        userAgent: req.headers?.['user-agent'],
      };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});

module.exports = httpLogger;
