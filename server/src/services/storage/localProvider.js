'use strict';

const fs = require('fs');
const path = require('path');

// Absolute path to server/uploads/
const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', '..', 'uploads');

/**
 * Delete files from the local filesystem.
 * Keys are relative paths within the uploads dir, e.g.:
 *   memories/{memoryId}/{filename}
 *
 * Best-effort — logs but does not throw.
 */
async function deleteFiles(keys) {
  for (const key of keys) {
    try {
      const filePath = path.join(UPLOADS_DIR, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('[Storage:local] Could not delete', key, '—', err.message);
    }
  }

  // Try to remove now-empty memory directories
  const memoryDirs = [...new Set(keys.map((k) => path.join(UPLOADS_DIR, path.dirname(k))))];
  for (const dir of memoryDirs) {
    try {
      const remaining = fs.readdirSync(dir);
      if (remaining.length === 0) fs.rmdirSync(dir);
    } catch (_) {}
  }
}

/**
 * Not available in local mode. Throws to prevent silent misuse.
 * The R2 presign flow is handled by r2Provider.
 */
async function getPresignedUrl() {
  throw new Error(
    'getPresignedUrl is not available in local storage mode (STORAGE_MODE=local). ' +
    'Use POST /api/memories/:id/images instead.'
  );
}

module.exports = { mode: 'local', deleteFiles, getPresignedUrl };
