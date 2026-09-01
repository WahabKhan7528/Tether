'use strict';

/**
 * Structured HTTP request logger.
 *
 * In development : uses a simple readable format via console
 * In production  : uses pino-http for JSON structured logging
 *
 * Each log entry includes:
 *   requestId, method, url, statusCode, responseTime (ms)
 */

const isDev = process.env.NODE_ENV !== 'production';

const pino = require('pino');
const pinoHttp = require('pino-http');

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
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
      return { id: req.id, method: req.method, url: req.url };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});

module.exports = httpLogger;
