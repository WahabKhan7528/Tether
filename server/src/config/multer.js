'use strict';

/**
 * Centralized Multer configuration factory for Tether.
 *
 * All file upload middleware should be created through these factories so that
 * MIME validation, size limits, and destination logic are consistent across
 * memories, gallery, and avatar routes.
 */

const path = require('path');
const fs   = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// ─── Image upload (disk storage) ─────────────────────────────────────────────
const IMAGE_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_MAX_SIZE     = 10 * 1024 * 1024; // 10 MB

/**
 * Create a Multer instance that saves images to disk.
 *
 * @param {string} subDir - Subdirectory under uploads/ (e.g. 'memories', 'gallery').
 *                          The actual destination will be uploads/{subDir}/{dynamicId}.
 * @param {(req) => string} getDynamicId - Returns the path segment after subDir (e.g. coupleId or memoryId).
 */
function createImageUpload(subDir, getDynamicId) {
  const storage = multer.diskStorage({
    destination(req, _file, cb) {
      const dir = path.join(UPLOADS_DIR, subDir, String(getDynamicId(req)));
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg';
      cb(null, `${uuidv4()}${ext}`);
    },
  });

  return multer({
    storage,
    limits:     { fileSize: IMAGE_MAX_SIZE },
    fileFilter: imageFileFilter,
  });
}

function imageFileFilter(_req, file, cb) {
  if (IMAGE_ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(
        new Error('File type not allowed. Use JPEG, PNG, or WebP.'),
        { statusCode: 400, code: 'UPLOAD_NOT_ALLOWED' }
      )
    );
  }
}


// ─── Avatar upload (memory storage → ImageKit) ────────────────────────────────
const AVATAR_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_SIZE     = 5 * 1024 * 1024; // 5 MB

function createAvatarUpload() {
  return multer({
    storage:    multer.memoryStorage(),
    limits:     { fileSize: AVATAR_MAX_SIZE },
    fileFilter: avatarFileFilter,
  });
}

function avatarFileFilter(_req, file, cb) {
  if (AVATAR_ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(
        new Error('Avatar must be JPEG, PNG, or WebP.'),
        { code: 'UPLOAD_NOT_ALLOWED' }
      )
    );
  }
}


// ─── Audio upload (disk storage) ──────────────────────────────────────────────
const AUDIO_ALLOWED_MIME = [
  'audio/mpeg', // .mp3
  'audio/wav',  // .wav
  'audio/ogg',  // .ogg
  'audio/flac', // .flac
  'audio/aac',  // .aac
  'audio/mp4',  // .m4a
  'audio/x-m4a'
];
const AUDIO_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Create a Multer instance that saves audio to disk.
 *
 * @param {string} subDir - Subdirectory under uploads/ (e.g. 'radyo').
 * @param {(req) => string} getDynamicId - Returns the path segment after subDir (e.g. coupleId).
 */
function createAudioUpload(subDir, getDynamicId) {
  return multer({
    storage: multer.memoryStorage(),
    limits:     { fileSize: AUDIO_MAX_SIZE },
    fileFilter: audioFileFilter,
  });
}

function audioFileFilter(_req, file, cb) {
  if (AUDIO_ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(
        new Error('File type not allowed. Use MP3, WAV, OGG, FLAC, AAC, or M4A.'),
        { statusCode: 400, code: 'UPLOAD_NOT_ALLOWED' }
      )
    );
  }
}

module.exports = {
  createImageUpload,
  createAvatarUpload,
  createAudioUpload,
  UPLOADS_DIR,
};
