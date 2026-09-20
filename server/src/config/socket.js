'use strict';

const { Server } = require('socket.io');
const cookie = require('cookie');
const { verifyAccessToken, ACCESS_COOKIE_NAME } = require('../utils/tokens');
const User = require('../models/User');

let io;

// ─── Socket event rate limiting ───────────────────────────────────────────────
// Tracks per-socket event call counts within a rolling window.
const RATE_WINDOW_MS = 10_000; // 10-second rolling window
const EVENT_RATE_LIMITS = {
  status_update: 5,
  send_hug: 3,
  radyo_play: 10,
  radyo_pause: 10,
  radyo_change_track: 10,
  radyo_seek: 20,
  typing_letter_start: 10,
  typing_letter_stop: 10,
  content_updated: 10,
  im_home: 3,
};

/**
 * Returns a rate-limiter check function for a given socket.
 * Uses an in-memory counter per (socket, event) pair, reset every RATE_WINDOW_MS.
 */
function createSocketRateLimiter(socket) {
  const counters = {};

  return function isRateLimited(eventName) {
    const limit = EVENT_RATE_LIMITS[eventName];
    if (!limit) return false;

    const now = Date.now();
    if (!counters[eventName] || now - counters[eventName].windowStart > RATE_WINDOW_MS) {
      counters[eventName] = { count: 0, windowStart: now };
    }

    counters[eventName].count++;

    if (counters[eventName].count > limit) {
      console.warn(
        `[Socket] Rate limit exceeded: event="${eventName}" user=${socket.user?._id} ` +
        `(${counters[eventName].count}/${limit} in ${RATE_WINDOW_MS}ms)`
      );
      return true;
    }
    return false;
  };
}

// ─── Generic payload sanitizer ────────────────────────────────────────────────
/**
 * Recursively strips any keys containing MongoDB operator characters ($, .)
 * from an object received via Socket.IO.
 * Express mongoSanitize does not cover socket payloads; a shallow strip is
 * insufficient because a nested { data: { $where: ... } } would pass through.
 */
function sanitizeSocketPayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const safe = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof key === 'string' && !key.includes('$') && !key.includes('.')) {
      safe[key] = (value && typeof value === 'object' && !Array.isArray(value))
        ? sanitizeSocketPayload(value)
        : value;
    }
  }
  return safe;
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' && process.env.CLIENT_URL
        ? process.env.CLIENT_URL
        : [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:4173'].filter(Boolean),
      credentials: true,
    },
    // Limit the maximum payload size for socket messages to prevent memory exhaustion
    maxHttpBufferSize: 1e5, // 100 KB
  });

  // ─── Authentication Middleware ──────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      // Prefer the token passed explicitly in the handshake auth object (avoids
      // SameSite=lax cookie restrictions on cross-origin WS upgrades in dev).
      // Fall back to the HttpOnly cookie for production same-origin connections.
      let token = socket.handshake.auth?.token;

      if (!token) {
        const cookieHeader = socket.handshake.headers.cookie;
        if (cookieHeader) {
          const cookies = cookie.parse(cookieHeader);
          token = cookies[ACCESS_COOKIE_NAME];
        }
      }

      if (!token) {
        return next(new Error('Authentication error'));
      }

      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch (err) {
        return next(new Error('Authentication error'));
      }

      const user = await User.findById(decoded.userId).lean();

      if (!user) {
        return next(new Error('Authentication error'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('[Socket] Auth middleware error:', err.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user._id}`);

    // ── Room Assignment ─────────────────────────────────────────────────────
    const room = socket.user.coupleId
      ? `couple_${socket.user.coupleId.toString()}`
      : `user_${socket.user._id.toString()}`;

    socket.join(room);
    console.log(`[Socket] User joined room: ${room}`);

    const isRateLimited = createSocketRateLimiter(socket);

    // ─── Status Update ───────────────────────────────────────────────────────
    socket.on('status_update', (data) => {
      if (isRateLimited('status_update')) return;
      const safe = sanitizeSocketPayload(data);

      const VALID_STATUSES = ['happy', 'sad', 'busy', 'sleeping', 'stressed', 'tired', 'sick', 'energetic', 'romantic', 'angry', 'relaxed'];
      if (!safe.status || !VALID_STATUSES.includes(safe.status)) return;

      socket.to(room).emit('partner_status_changed', {
        status: safe.status,
        userId: socket.user._id,
      });
    });

    // ─── Radyo Sync Events ───────────────────────────────────────────────────
    socket.on('radyo_play', () => {
      if (isRateLimited('radyo_play')) return;
      socket.to(room).emit('radyo_play');
    });

    socket.on('radyo_pause', () => {
      if (isRateLimited('radyo_pause')) return;
      socket.to(room).emit('radyo_pause');
    });

    socket.on('radyo_change_track', (data) => {
      if (isRateLimited('radyo_change_track')) return;
      const safe = sanitizeSocketPayload(data);
      socket.to(room).emit('radyo_change_track', {
        trackId: typeof safe.trackId === 'string' ? safe.trackId.slice(0, 100) : undefined,
        trackUrl: typeof safe.trackUrl === 'string' ? safe.trackUrl.slice(0, 500) : undefined,
        title: typeof safe.title === 'string' ? safe.title.slice(0, 200) : undefined,
      });
    });

    socket.on('radyo_seek', (data) => {
      if (isRateLimited('radyo_seek')) return;
      const safe = sanitizeSocketPayload(data);
      const time = Number(safe.time);
      if (!Number.isFinite(time) || time < 0) return;
      socket.to(room).emit('radyo_seek', { time });
    });

    // ─── Virtual Hugs ────────────────────────────────────────────────────────
    socket.on('send_hug', () => {
      if (isRateLimited('send_hug')) return;
      socket.to(room).emit('receive_hug', {
        senderName: socket.user.name,
        senderId: socket.user._id,
      });
    });

    // ─── Letter Typing Indicators ────────────────────────────────────────────
    socket.on('typing_letter_start', () => {
      if (isRateLimited('typing_letter_start')) return;
      socket.to(room).emit('partner_typing_letter');
    });

    socket.on('typing_letter_stop', () => {
      if (isRateLimited('typing_letter_stop')) return;
      socket.to(room).emit('partner_stopped_typing_letter');
    });

    // ─── I'm Home ────────────────────────────────────────────────────────────
    socket.on('im_home', () => {
      if (isRateLimited('im_home')) return;
      socket.to(room).emit('partner_is_home', {
        senderName: socket.user.name,
        senderId: socket.user._id,
      });
    });

    // ─── Feed / Content Updates ──────────────────────────────────────────────
    socket.on('content_updated', (data) => {
      if (isRateLimited('content_updated')) return;
      const safe = sanitizeSocketPayload(data);
      const VALID_TYPES = ['memory', 'gallery', 'letter', 'reel'];
      socket.to(room).emit('content_updated', {
        type: VALID_TYPES.includes(safe.type) ? safe.type : 'memory',
      });
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user._id}`);
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = {
  initSocket,
  getIo,
};
