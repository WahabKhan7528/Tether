'use strict';

require('dotenv').config();
const validateEnv = require('./config/validateEnv');
validateEnv();

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

// ─── Render keepalive ─────────────────────────────────────────────────────────
// Render free-tier spins down after ~15 min of inactivity.
// Self-ping every 7 minutes keeps the instance awake.
const KEEPALIVE_INTERVAL_MS = 7 * 60 * 1000; // 7 minutes
let keepaliveTimer = null;

function startKeepalive(port) {
  if (process.env.NODE_ENV !== 'production') return;
  const SELF_URL = process.env.SERVER_URL || `http://localhost:${port}`;
  keepaliveTimer = setInterval(() => {
    http.get(`${SELF_URL}/api/health`, (res) => {
      res.resume(); // discard body
    }).on('error', (err) => {
      console.warn('[Tether] Keepalive ping failed:', err.message);
    });
  }, KEEPALIVE_INTERVAL_MS);
  console.log(`[Tether] Render keepalive enabled — pinging /api/health every 7 min`);
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
function gracefulShutdown(signal, server) {
  console.log(`[Tether] ${signal} received — shutting down gracefully`);
  server.close(async () => {
    console.log('[Tether] HTTP server closed');
    if (keepaliveTimer) clearInterval(keepaliveTimer);
    try {
      await mongoose.disconnect();
      console.log('[Tether] MongoDB disconnected');
    } catch (err) {
      console.error('[Tether] MongoDB disconnect error:', err.message);
    }
    process.exit(0);
  });

  // Force-kill if graceful shutdown takes too long (10s)
  setTimeout(() => {
    console.error('[Tether] Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);
}

// ─── Entry Point ─────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`[Tether] Server → http://localhost:${PORT}`);
    console.log('[Tether] Auth: JWT cookie-based sessions enabled');
    startKeepalive(PORT);
  });

  const { initSocket } = require('./config/socket');
  initSocket(server);


  process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
  process.on('SIGINT',  () => gracefulShutdown('SIGINT',  server));
}

start();
