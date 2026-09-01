'use strict';

const User = require('../models/User');
const { verifyAccessToken, verifyRefreshToken, setAuthCookies } = require('../utils/tokens');
const { createError } = require('./errorHandler');

// ─── authenticate ──────────────────────────────────────────────────────────────
/**
 * Attaches req.user from the HttpOnly accessToken cookie.
 *
 * If the accessToken is expired but a valid refreshToken cookie exists,
 * we silently rotate both tokens (sliding session) and continue.
 *
 * Rejects with 401 if:
 *   - No accessToken cookie and no valid refreshToken
 *   - Token is tampered / invalid
 *   - User does not exist in DB
 */
async function authenticate(req, res, next) {
  // ── Try access token from HttpOnly cookie ─────────────────────────────────
  const accessToken = req.cookies?.accessToken;

  if (accessToken) {
    try {
      const decoded = verifyAccessToken(accessToken);
      const user = await User.findById(decoded.userId).lean();
      if (!user) return next(createError('User not found', 401, 'UNAUTHORIZED'));
      req.user = user;
      return next();
    } catch (err) {
      // Access token invalid or expired — fall through to refresh attempt
      if (err.name !== 'TokenExpiredError') {
        return next(createError('Invalid token', 401, 'UNAUTHORIZED'));
      }
    }
  }

  // ── Access token missing or expired: try refresh token (silent rotation) ─
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return next(createError('Authentication required. Please log in.', 401, 'UNAUTHORIZED'));
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).lean();
    if (!user) return next(createError('User not found', 401, 'UNAUTHORIZED'));

    // Silently rotate tokens (new access + refresh cookies)
    setAuthCookies(res, user._id);

    req.user = user;
    return next();
  } catch (_) {
    return next(createError('Session expired. Please log in again.', 401, 'UNAUTHORIZED'));
  }
}

// ─── requirePaired ────────────────────────────────────────────────────────────
/**
 * Ensures the authenticated user has a valid coupleId (is fully paired).
 * Must be used AFTER authenticate().
 */
function requirePaired(req, res, next) {
  if (!req.user.coupleId) {
    return next(
      createError('You must be paired with a partner to access this resource', 403, 'NOT_PAIRED')
    );
  }
  next();
}

// ─── requireOnboarded ─────────────────────────────────────────────────────────
/**
 * Ensures the authenticated user has completed the onboarding questionnaire.
 * Must be used AFTER authenticate().
 */
function requireOnboarded(req, res, next) {
  if (!req.user.onboardingComplete) {
    return next(
      createError('Please complete your profile setup before continuing.', 403, 'ONBOARDING_INCOMPLETE')
    );
  }
  next();
}

module.exports = { authenticate, requirePaired, requireOnboarded };
