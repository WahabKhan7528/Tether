'use strict';

const jwt = require('jsonwebtoken');

/**
 * Token utilities for Tether's cookie+JWT auth strategy.
 *
 * Both access and refresh tokens are issued as HttpOnly cookies:
 *   - accessToken  : short-lived (15 min), HttpOnly, SameSite=Strict
 *   - refreshToken : long-lived  (7 days),  HttpOnly, SameSite=Strict, path=/api/auth
 *
 * This removes the need for localStorage entirely and mitigates XSS token theft.
 */

// ─── Token generation ─────────────────────────────────────────────────────────

function generateAccessToken(userId) {
  return jwt.sign({ userId: userId.toString() }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });
}

function generateRefreshToken(userId, tokenFamily) {
  return jwt.sign(
    { userId: userId.toString(), family: tokenFamily }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
}

// ─── Token verification ───────────────────────────────────────────────────────

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE_NAME = isProd ? '__Host-psifi.access' : 'psifi.access';
const REFRESH_COOKIE_NAME = isProd ? '__Host-psifi.refresh' : 'psifi.refresh';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,              // JS cannot read these cookies
  secure: isProd,              // HTTPS only in production
  sameSite: isProd ? 'none' : 'lax', // 'none' required for cross-domain (Vercel -> Render)
};

/**
 * Set both access and refresh tokens as HttpOnly cookies.
 * This is called after signup and login.
 */
function setAuthCookies(res, userId, tokenFamily = null) {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId, tokenFamily);

  // Access token cookie — 15 min
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes in ms
  });

  // Refresh token cookie — 7 days, scoped to /api/auth to minimise exposure
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/api/v1/auth',
  });

  return { accessToken, refreshToken };
}

/**
 * Clear both auth cookies on logout.
 */
function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE_NAME, { ...BASE_COOKIE_OPTIONS });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...BASE_COOKIE_OPTIONS, path: '/api/v1/auth' });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
};
