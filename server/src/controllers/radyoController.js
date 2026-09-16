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
      url: `/api/radyo/stream/${track._id}`,
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
      url: `/api/radyo/stream/${track._id}`,
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

    const contentType = track.contentType || 'audio/mpeg';
    const audioSize = track.audioData.length;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : audioSize - 1;
      
      if (start >= audioSize) {
        res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + audioSize);
        return;
      }
      
      const chunksize = (end - start) + 1;
      const bufferChunk = track.audioData.subarray(start, end + 1);

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${audioSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      res.end(bufferChunk);
    } else {
      res.writeHead(200, {
        'Content-Length': audioSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });
      res.end(track.audioData);
    }
  } catch (error) {
    next(error);
  }
};
