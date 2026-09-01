'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { doubleCsrf } = require('csrf-csrf');

const requestId = require('./middleware/requestId');
const httpLogger = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes      = require('./routes/auth.routes');
const coupleRoutes    = require('./routes/couples.routes');
const categoryRoutes  = require('./routes/categories.routes');
const memoryRoutes    = require('./routes/memories.routes');
const reelRoutes      = require('./routes/reels.routes');
const galleryRoutes   = require('./routes/gallery.routes');
const letterRoutes    = require('./routes/letters.routes');
const radyoRoutes     = require('./routes/radyo.routes');

const app = express();

// ─── Trust proxy (for accurate IP in rate limiting behind nginx/Render) ────────
app.set('trust proxy', 1);

// ─── Request ID (must be first) ───────────────────────────────────────────────
app.use(requestId);

// ─── Structured Logging ───────────────────────────────────────────────────────
app.use(httpLogger);

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: process.env.NODE_ENV === 'production' ? 'same-origin' : 'cross-origin',
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc:     ["'self'", 'data:', 'https://ik.imagekit.io', 'https://*.imagekit.io'],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'https://ik.imagekit.io', 'https://*.imagekit.io'],
        frameSrc:   ["'none'"],
        objectSrc:  ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    frameguard: { action: 'deny' },
    noSniff:    true,
    xssFilter:  true,
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' && process.env.CLIENT_URL
      ? process.env.CLIENT_URL
      : [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:4173'].filter(Boolean),
    credentials:    true,          // Required for cookie-based auth
    methods:        ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
    exposedHeaders: ['X-Request-ID'],
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ─── NoSQL Injection Sanitization ─────────────────────────────────────────────
// Strips $ and . from req.body, req.query, req.params to prevent MongoDB injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitizeRequest: ({ req }) => {
    console.warn(`[Security] Mongo injection attempt detected from ${req.ip} [${req.id}]`);
  },
}));

// ─── CSRF Protection (csrf-csrf) ──────────────────────────────────────────────
// SameSite=Strict on cookies provides the primary CSRF defence; CSRF tokens add
// a second layer for any future cross-site scenarios (email links, etc.).
const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.JWT_ACCESS_SECRET || 'csrf-secret-fallback',
  cookieName: process.env.NODE_ENV === 'production' ? '__Host-psifi.x-csrf-token' : 'x-csrf-token',
  cookieOptions: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size:     64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getSessionIdentifier: () => 'stateless',
});

// Public endpoint to hand a CSRF token to the client
app.get('/api/csrf-token', (req, res) => {
  return res.json({ success: true, data: { csrfToken: generateCsrfToken(req, res) } });
});

// Apply CSRF protection to all state-mutating API routes
// (exempt: /api/auth/signup, /api/auth/login, /api/auth/refresh — handled below per-route)
app.use('/api', (req, res, next) => {
  // Skip CSRF for auth bootstrap routes that are called before the client can fetch a token
  const skipPaths = ['/auth/signup', '/auth/login', '/auth/refresh', '/auth/logout', '/health', '/csrf-token'];
  const reqPath = req.path;
  if (skipPaths.some(p => reqPath === p || reqPath.startsWith(p + '/'))) {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
});

// ─── Static File Serving (dev local uploads) ──────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  fallthrough: false,
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const makeRateLimiter = (max, windowMinutes = 15) =>
  rateLimit({
    windowMs:      windowMinutes * 60 * 1000,
    max,
    message:       { success: false, message: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
    standardHeaders: true,
    legacyHeaders:   false,
    keyGenerator:    (req) => req.ip,
  });

const signupLimiter  = makeRateLimiter(5);   // 5 signups / 15 min
const loginLimiter   = makeRateLimiter(10);  // 10 login attempts / 15 min
const refreshLimiter = makeRateLimiter(30);  // 30 refreshes / 15 min
const generalLimiter = makeRateLimiter(200); // general API

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth/signup',  signupLimiter);
app.use('/api/auth/login',   loginLimiter);
app.use('/api/auth/refresh', refreshLimiter);

app.use('/api/auth',       authRoutes);
app.use('/api/couples',    generalLimiter, coupleRoutes);
app.use('/api/categories', generalLimiter, categoryRoutes);
app.use('/api/memories',   generalLimiter, memoryRoutes);
app.use('/api/reels',      generalLimiter, reelRoutes);
app.use('/api/gallery',    generalLimiter, galleryRoutes);
app.use('/api/letters',    generalLimiter, letterRoutes);
app.use('/api/radyo',      generalLimiter, radyoRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
// Used by Render keepalive pings and deployment readiness probes
app.get('/api/health', (req, res) =>
  res.json({
    success: true,
    data: {
      status:      'ok',
      service:     'Tether API',
      storageMode: process.env.STORAGE_MODE || 'local',
      env:         process.env.NODE_ENV || 'development',
      requestId:   req.id,
    },
  })
);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success:   false,
    message:   'Route not found',
    code:      'NOT_FOUND',
    requestId: req.id,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
