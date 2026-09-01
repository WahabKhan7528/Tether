const path = require('path');
const fs = require('fs');
const Track = require('../models/Track');
const { UPLOADS_DIR } = require('../config/multer');

const { audioStorage } = require('../services/storage');

/**
 * Upload a new track for the couple
 */
exports.uploadTrack = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded.' });
    }

    // Upload to ImageKit (since audioStorage points to ImageKit Provider)
    const { url, key } = await audioStorage.uploadBuffer({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      folder: `tether/${req.user.coupleId}/radyo`,
    });

    const track = await Track.create({
      coupleId: req.user.coupleId,
      uploadedBy: req.user._id,
      name: req.file.originalname,
      url: url,
      r2Key: key, // Reusing r2Key field name for the ImageKit fileId
    });

    await track.populate('uploadedBy', 'displayName profilePicture');

    res.status(201).json({ success: true, data: track });
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
      .populate('uploadedBy', 'displayName profilePicture')
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

    // Delete from R2 if applicable
    if (track.r2Key) {
      await audioStorage.deleteFiles([track.r2Key]);
    } else if (track.url && track.url.includes('/uploads/')) {
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
