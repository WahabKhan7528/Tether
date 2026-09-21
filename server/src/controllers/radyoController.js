const mongoose = require('mongoose');
const Track = require('../models/Track');

/**
 * Upload a new track for the couple
 */
exports.uploadTrack = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded.' });
    }

    const trackId = new mongoose.Types.ObjectId();

    const track = await Track.create({
      _id: trackId,
      coupleId: req.coupleId,
      uploadedBy: req.user._id,
      name: req.file.originalname,
      audioData: req.file.buffer,
      contentType: req.file.mimetype,
    });

    await track.populate('uploadedBy', 'name nickname avatarUrl');

    const formattedTrack = {
      _id: track._id,
      coupleId: track.coupleId,
      uploadedBy: track.uploadedBy,
      name: track.name,
      createdAt: track.createdAt,
      updatedAt: track.updatedAt,
      url: `radyo/stream/${track._id}`,
    };
    
    res.status(201).json({ success: true, data: formattedTrack });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tracks for the couple
 */
exports.getTracks = async (req, res, next) => {
  try {
    const tracks = await Track.find({ coupleId: req.coupleId })
      .select('-audioData')
      .populate('uploadedBy', 'name nickname avatarUrl')
      .sort({ createdAt: 1 })
      .lean();

    const formattedTracks = tracks.map(track => ({
      ...track,
      url: `radyo/stream/${track._id}`,
    }));

    res.status(200).json({
      success: true,
      data: formattedTracks,
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
    const track = await Track.findOne({ _id: req.params.id, coupleId: req.coupleId }).select('_id');

    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found.' });
    }

    await Track.deleteOne({ _id: track._id });

    res.status(200).json({
      success: true,
      data: { message: 'Track deleted' },
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
    const track = await Track.findOne({ _id: req.params.id, coupleId: req.coupleId });

    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found.' });
    }

    // Fallback for legacy tracks stored on ImageKit
    if (!track.audioData && track.url) {
      const signMediaUrl = require('../utils/signMediaUrl');
      return res.redirect(302, signMediaUrl(track.url));
    }

    if (!track.audioData) {
      return res.status(404).json({ success: false, message: 'Audio data not found.' });
    }

    // Explicitly convert Mongoose Buffer to plain Node.js Buffer.
    // Mongoose returns a Buffer subclass from MongoDB Binary — calling .length or
    // .subarray() on it can behave unexpectedly across different driver versions.
    const audioBuffer = Buffer.from(track.audioData);
    const contentType = track.contentType || 'audio/mpeg';
    const audioSize = audioBuffer.length;

    if (audioSize === 0) {
      return res.status(404).json({ success: false, message: 'Audio data is empty.' });
    }

    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : audioSize - 1;

      if (start >= audioSize) {
        res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + audioSize);
        return;
      }

      const safeEnd = Math.min(end, audioSize - 1);
      const chunksize = safeEnd - start + 1;
      const bufferChunk = audioBuffer.subarray(start, safeEnd + 1);

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${safeEnd}/${audioSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store',
      });
      res.end(bufferChunk);
    } else {
      res.writeHead(200, {
        'Content-Length': audioSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-store',
      });
      res.end(audioBuffer);
    }
  } catch (error) {
    next(error);
  }
};
