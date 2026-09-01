'use strict';

const { Server } = require('socket.io');
const cookie = require('cookie');
const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:4173'],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        return next(new Error('Authentication error'));
      }
      
      const cookies = cookie.parseCookie(cookieHeader);
      const token = cookies.accessToken;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).lean();
      
      if (!user || !user.coupleId) {
        return next(new Error('Authentication error or not paired'));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      console.error('[Socket Error]:', err.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user._id}`);
    
    // Join a room specifically for this couple
    const room = `couple_${socket.user.coupleId.toString()}`;
    socket.join(room);
    console.log(`[Socket] User joined room: ${room}`);

    // Listen for mood changes and broadcast to partner
    socket.on('status_update', (data) => {
      socket.to(room).emit('partner_status_changed', { status: data.status, userId: socket.user._id });
    });

    // Radyo Sync Events
    socket.on('radyo_play', () => socket.to(room).emit('radyo_play'));
    socket.on('radyo_pause', () => socket.to(room).emit('radyo_pause'));
    socket.on('radyo_change_track', (data) => socket.to(room).emit('radyo_change_track', data));
    socket.on('radyo_seek', (data) => socket.to(room).emit('radyo_seek', data));

    // Virtual Hugs
    socket.on('send_hug', () => socket.to(room).emit('receive_hug', { senderName: socket.user.name, senderId: socket.user._id }));

    // Letter Typing Indicators
    socket.on('typing_letter_start', () => socket.to(room).emit('partner_typing_letter'));
    socket.on('typing_letter_stop', () => socket.to(room).emit('partner_stopped_typing_letter'));

    // Feed / Content Updates
    socket.on('content_updated', (data) => socket.to(room).emit('content_updated', data));

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
  getIo
};
