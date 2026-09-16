'use strict';

const User = require('../models/User');
const mongoose = require('mongoose');
const { verifyAccessToken, verifyRefreshToken, setAuthCookies, ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } = require('../utils/tokens');
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
 *
 * Security note: All error responses use the same generic message to prevent
 * username enumeration or token-state discovery by an attacker.
 */
async function authenticate(req, res, next) {
  // ── Try access token from HttpOnly cookie ─────────────────────────────────
  const accessToken = req.cookies?.[ACCESS_COOKIE_NAME];

  if (accessToken) {
    try {
      const decoded = verifyAccessToken(accessToken);
      const user = await User.findById(decoded.userId)
        .select('_id name email role coupleId onboardingComplete currentStatus hugsSent avatarUrl nickname')
        .lean();
      if (!user) return next(createError('Authentication required. Please log in.', 401, 'UNAUTHORIZED'));
      req.user = user;
      return next();
    } catch (err) {
      // Access token invalid or expired — fall through to refresh attempt
      if (err.name !== 'TokenExpiredError') {
        // Token is tampered or malformed — reject immediately with generic message
        return next(createError('Authentication required. Please log in.', 401, 'UNAUTHORIZED'));
      }
    }
  }

  // ── Access token missing or expired: try refresh token (silent rotation) ─
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    return next(createError('Authentication required. Please log in.', 401, 'UNAUTHORIZED'));
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('+tokenFamily'); // We don't use lean here because we might need to save()

    if (!user) return next(createError('Authentication required. Please log in.', 401, 'UNAUTHORIZED'));

    // Token reuse detection (stolen refresh token)
    if (decoded.family && user.tokenFamily && decoded.family !== user.tokenFamily) {
      // Hijack detected! Clear family to revoke ALL refresh tokens for this user immediately
      console.warn(`[Security - Audit] Token family hijack detected for user ${user._id}`);
      user.tokenFamily = null;
      user.tokenFamilyIssuedAt = null;
      await user.save();
      const { clearAuthCookies } = require('../utils/tokens');
      clearAuthCookies(res);
      return next(createError('Session invalidated due to suspicious activity. Please log in again.', 401, 'UNAUTHORIZED'));
    }

    // Silently rotate tokens (new access + refresh cookies)
    setAuthCookies(res, user._id, user.tokenFamily);

    req.user = user.toObject(); // Since we didn't use lean(), convert to object
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
       return next(createError('Session expired. Please log in again.', 401, 'UNAUTHORIZED'));
    }
    return next(createError('Authentication failed. Please log in again.', 401, 'UNAUTHORIZED'));
  }
}

// ─── requirePaired ────────────────────────────────────────────────────────────
/**
 * Ensures the authenticated user has a valid coupleId (is fully paired).
 * Must be used AFTER authenticate().
 */
function requirePaired(req, res, next) {
  const raw = req.user.coupleId?._id || req.user.coupleId;
  if (!raw) {
    return next(
      createError('You must be paired with a partner to access this resource', 403, 'NOT_PAIRED')
    );
  }
  req.coupleId = new mongoose.Types.ObjectId(raw);
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
