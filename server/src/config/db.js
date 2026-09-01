'use strict';

const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize:              10,   // up to 10 concurrent connections per server process
      serverSelectionTimeoutMS: 5000, // fail fast if Atlas is unreachable
      socketTimeoutMS:          45000,// close sockets that are idle for 45s
    });
    console.log('[Tether] MongoDB connected');
  } catch (err) {
    console.error('[Tether] MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
