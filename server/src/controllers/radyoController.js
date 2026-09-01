const path = require('path');
const fs = require('fs');
const util = require('util');
const zlib = require('zlib');
const mongoose = require('mongoose');
const Track = require('../models/Track');
const { UPLOADS_DIR } = require('../config/multer');

const gzip = util.promisify(zlib.gzip);
const gunzip = util.promisify(zlib.gunzip);

const { audioStorage } = require('../services/storage');

/**
 * Upload a new track for the couple
 */
exports.uploadTrack = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded.' });
    }

    const compressedBuffer = await gzip(req.file.buffer);
    const trackId = new mongoose.Types.ObjectId();

    const track = await Track.create({
      _id: trackId,
      coupleId: req.user.coupleId,
      uploadedBy: req.user._id,
      name: req.file.originalname,
      url: `/api/radyo/stream/${trackId}`,
      audioData: compressedBuffer,
      contentType: req.file.mimetype,
      isCompressed: true,
    });

    await track.populate('uploadedBy', 'name nickname avatarUrl');
    
    const trackResponse = track.toObject();
    delete trackResponse.audioData;

    res.status(201).json({ success: true, data: trackResponse });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tracks for the couple
 */
exports.getTracks = async (req, res, next) => {
  try {
    const tracks = await Track.find({ coupleId: req.user.coupleId })
      .select('-audioData')
      .populate('uploadedBy', 'name nickname avatarUrl')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: tracks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a track
 */
exports.deleteTrack = async (req, res, next) => {
  try {
    const track = await Track.findOne({ _id: req.params.id, coupleId: req.user.coupleId });

    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found.' });
    }

    if (track.url && track.url.includes('/uploads/')) {
      // Fallback for old local files
      const filePath = path.join(UPLOADS_DIR, track.url.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Track.deleteOne({ _id: track._id });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream a track's audio data
 */
exports.streamTrack = async (req, res, next) => {
  try {
    const track = await Track.findOne({ _id: req.params.id });

    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found.' });
    }

    if (!track.audioData) {
       if (track.url && !track.url.startsWith('/api/radyo/stream')) {
         return res.redirect(track.url);
       }
       return res.status(404).json({ success: false, message: 'Audio data not found.' });
    }

    let buffer = track.audioData;
    if (track.isCompressed) {
      buffer = await gunzip(buffer);
    }

    res.set('Content-Type', track.contentType || 'audio/mpeg');
    res.set('Accept-Ranges', 'bytes');
    res.set('Cache-Control', 'public, max-age=31536000');

    const range = req.headers.range;

    if (!range) {
      res.set('Content-Length', buffer.length);
      return res.send(buffer);
    }

    const parts = range.replace(/bytes=/, '').split('-');
    const partialstart = parts[0];
    const partialend = parts[1];

    const start = parseInt(partialstart, 10);
    const end = partialend ? parseInt(partialend, 10) : buffer.length - 1;
    
    if (start >= buffer.length || end >= buffer.length) {
      res.set('Content-Range', `bytes */${buffer.length}`);
      return res.status(416).send();
    }
    
    const chunksize = (end - start) + 1;

    res.status(206);
    res.set('Content-Range', `bytes ${start}-${end}/${buffer.length}`);
    res.set('Content-Length', chunksize);
    
    res.send(buffer.slice(start, end + 1));
  } catch (error) {
    next(error);
  }
};
