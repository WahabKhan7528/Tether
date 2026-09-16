'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { doubleCsrf } = require('csrf-csrf');
const hpp = require('hpp');

const requestId = require('./middleware/requestId');
const httpLogger = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const xssSanitize = require('./middleware/xssSanitize');
const { ACCESS_COOKIE_NAME } = require('./utils/tokens');

const authRoutes      = require('./routes/auth.routes');
const coupleRoutes    = require('./routes/couples.routes');
const categoryRoutes  = require('./routes/categories.routes');
const memoryRoutes    = require('./routes/memories.routes');
const reelRoutes      = require('./routes/reels.routes');
const galleryRoutes   = require('./routes/gallery.routes');
const letterRoutes    = require('./routes/letters.routes');
const radyoRoutes     = require('./routes/radyo.routes');
const promptsRoutes   = require('./routes/prompts.routes');

const app = express();

// ─── Trust proxy (for accurate IP in rate limiting behind nginx/Render) ────────
app.set('trust proxy', 1);

// ─── Request ID (must be first) ───────────────────────────────────────────────
app.use(requestId);

// ─── Structured Logging ───────────────────────────────────────────────────────
app.use(httpLogger);

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
// Disable Express's default 'X-Powered-By: Express' header to reduce fingerprinting
app.disable('x-powered-by');

app.use(
  helmet({
    // ── Content Security Policy ──────────────────────────────────────────────
    // Tightly controls which resources the browser is allowed to load.
    // 'unsafe-inline' is kept for styleSrc because Tailwind injects inline styles.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc:              ["'self'"],
        scriptSrc:               ["'self'"],
        scriptSrcAttr:           ["'none'"],            // Disallow inline event handlers
        styleSrc:                ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc:                 ["'self'", 'https://fonts.gstatic.com'],
        imgSrc:                  ["'self'", 'data:', 'blob:', 'https://ik.imagekit.io', 'https://*.imagekit.io'],
        mediaSrc:                ["'self'", 'blob:'],   // Allow blob: for audio/video playback
        connectSrc:              ["'self'", 'https://ik.imagekit.io', 'https://*.imagekit.io', 'wss:', 'ws:'],  // wss/ws for Socket.IO
        frameSrc:                ["'none'"],            // Disallow iframes entirely
        frameAncestors:          ["'none'"],            // Prevent this page from being embedded
        objectSrc:               ["'none'"],            // Disallow plugins (Flash, etc.)
        baseUri:                 ["'self'"],            // Prevent base tag hijacking
        formAction:              ["'self'"],            // Restrict form submissions
        workerSrc:               ["'self'", 'blob:'],  // Allow service workers
        manifestSrc:             ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },

    // ── Cross-Origin Resource Policy ─────────────────────────────────────────
    // 'cross-origin' is required so ImageKit assets can be displayed in the browser
    crossOriginResourcePolicy: { policy: 'cross-origin' },

    // ── Cross-Origin Opener Policy ───────────────────────────────────────────
    // Prevents other pages from gaining a reference to this window (Spectre mitigation)
    crossOriginOpenerPolicy:   { policy: 'same-origin' },

    // ── Cross-Origin Embedder Policy ─────────────────────────────────────────
    // Disabled because 'require-corp' would block loading cross-origin images/audio
    // without CORP headers on those CDN resources (ImageKit)
    crossOriginEmbedderPolicy: false,

    // ── HTTP Strict Transport Security ───────────────────────────────────────
    // Forces HTTPS for 1 year, including subdomains. Only active in production.
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,

    // ── X-Frame-Options ──────────────────────────────────────────────────────
    // Prevents clickjacking by disallowing this page in any iframe
    frameguard: { action: 'deny' },

    // ── X-Content-Type-Options ───────────────────────────────────────────────
    // Prevents MIME-type sniffing attacks
    noSniff: true,

    // ── X-XSS-Protection ─────────────────────────────────────────────────────
    // Legacy XSS filter for older browsers (CSP is the modern replacement)
    xssFilter: true,

    // ── Referrer-Policy ──────────────────────────────────────────────────────
    // Controls how much referrer info is sent with requests
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // ── Permissions-Policy (formerly Feature-Policy) ─────────────────────────
    // Explicitly disable browser features not needed by this application.
    // Geolocation is left unlisted (which means it can still be requested via JS API)
    // because the app legitimately needs it for location sharing.
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },

    // ── DNS Prefetch Control ──────────────────────────────────────────────────
    // Disabling DNS prefetch prevents some information leakage
    dnsPrefetchControl: { allow: false },

    // ── IE No Open ───────────────────────────────────────────────────────────
    // Prevents IE from executing downloads in the context of the site
    ieNoOpen: true,

    // ── Origin-Agent-Cluster ─────────────────────────────────────────────────
    // Requests browser to isolate this page in its own agent cluster
    originAgentCluster: true,
  })
);

// ─── Permissions-Policy header (not yet in helmet@7 — set manually) ──────────
// Explicitly lock down browser APIs that Tether does not use.
// 'geolocation=*' is intentionally omitted from the deny list because the
// partner location tracking feature requires it from the client's JS API.
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',           // No camera access
      'microphone=()',       // No microphone access
      'geolocation=()',      // Location tracking feature removed — no geolocation needed
      'payment=()',          // No payment API
      'usb=()',              // No USB access
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'display-capture=()',
      'fullscreen=(self)',   // Fullscreen only from this origin (gallery lightbox)
    ].join(', ')
  );
  next();
});

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

// ─── Body Parsing ─────────────────────────────────────────────────────────────────
// 50kb is plenty — all file uploads go through ImageKit; large JSON is never legitimate
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(cookieParser());

// ─── HTTP Parameter Pollution (HPP) Protection ────────────────────────────────
// Prevents attackers from sending arrays for parameters that expect a single value
// (e.g., ?id=1&id=2 could bypass some checks). We whitelist parameters that are
// legitimately expected to be repeated (currently none for this app).
app.use(hpp());

// ─── NoSQL Injection Sanitization ─────────────────────────────────────────────
// Strips $ and . from req.body, req.query, req.params to prevent MongoDB operator injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitizeRequest: ({ req }) => {
    console.warn(`[Security] Mongo injection attempt detected from ${req.ip} [${req.id}]`);
  },
}));

// ─── XSS Sanitization ─────────────────────────────────────────────────────────
// HTML-escapes all string values in req.body to prevent Stored XSS.
// This is a defence-in-depth measure — React's JSX auto-escaping already
// protects the client, but sanitizing at ingestion is best practice.
app.use(xssSanitize);

// ─── CSRF Protection (csrf-csrf) ──────────────────────────────────────────────
// SameSite=Strict on cookies provides the primary CSRF defence; CSRF tokens add
// a second layer for any future cross-site scenarios (email links, etc.).
const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  // CSRF_SECRET is a required env var (enforced by validateEnv); no fallback needed
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: process.env.NODE_ENV === 'production' ? '__Host-psifi.x-csrf-token' : 'x-csrf-token',
  cookieOptions: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size:     64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  // Tie the token to the requesting user's session so CSRF tokens aren't globally valid
  getSessionIdentifier: (req) => req.cookies?.[ACCESS_COOKIE_NAME] ?? 'anonymous',
});

// Public endpoint to hand a CSRF token to the client
app.get('/api/v1/csrf-token', (req, res) => {
  return res.json({ success: true, data: { csrfToken: generateCsrfToken(req, res) } });
});

// Apply CSRF protection to all state-mutating API routes
// (exempt: /api/v1/auth/signup, /api/v1/auth/login, /api/v1/auth/refresh — handled below per-route)
app.use('/api/v1', (req, res, next) => {
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
  setHeaders: (res, path) => {
    res.setHeader('Content-Disposition', 'attachment');
  },
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Memory-based (single-instance). Upgrade to RedisStore if scaling horizontally.
const makeRateLimiter = (max, windowMinutes = 15, message = 'Too many requests. Please try again later.') =>
  rateLimit({
    windowMs:        windowMinutes * 60 * 1000,
    max,
    message:         { success: false, message, code: 'RATE_LIMITED' },
    standardHeaders: true,   // Return rate limit info in RateLimit-* headers (RFC 6585)
    legacyHeaders:   false,  // Disable deprecated X-RateLimit-* headers
    keyGenerator:    (req) => req.ip,
    // Skip rate limiting for trusted internal health check pings
    skip:            (req) => req.path === '/api/v1/health' && req.ip === '::1',
  });

// Auth-specific limiters (strict — protect against brute force and abuse)
const signupLimiter  = makeRateLimiter(5,   15, 'Too many signup attempts. Please try again in 15 minutes.');
const loginLimiter   = makeRateLimiter(10,  15, 'Too many login attempts. Please try again in 15 minutes.');
const refreshLimiter = makeRateLimiter(30,  15, 'Token refresh rate limit exceeded. Please log in again.');
const avatarLimiter  = makeRateLimiter(10,  60, 'Too many avatar uploads. Please try again in 1 hour.');

// General API limiter — applied to all authenticated routes
const generalLimiter = makeRateLimiter(200, 15);

// Presigned URL limiter — prevent excessive R2 upload slot generation
const presignLimiter = makeRateLimiter(30,  15, 'Too many upload requests. Please slow down.');

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth/signup',         signupLimiter);
app.use('/api/v1/auth/login',          loginLimiter);
app.use('/api/v1/auth/refresh',        refreshLimiter);
app.use('/api/v1/auth/me/avatar',      avatarLimiter);

app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/couples',    generalLimiter, coupleRoutes);
app.use('/api/v1/categories', generalLimiter, categoryRoutes);
app.use('/api/v1/memories',   generalLimiter, memoryRoutes);
app.use('/api/v1/reels',      generalLimiter, reelRoutes);
app.use('/api/v1/gallery',    generalLimiter, galleryRoutes);
app.use('/api/v1/letters',    generalLimiter, letterRoutes);
app.use('/api/v1/radyo',      generalLimiter, radyoRoutes);
app.use('/api/v1/prompts',    generalLimiter, promptsRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
// Used by Render keepalive pings and deployment readiness probes
app.get('/api/v1/health', (req, res) =>
  res.json({
    success: true,
    data: {
      status:      'ok',
      service:     'Tether API',
      storageMode: 'imagekit',
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
