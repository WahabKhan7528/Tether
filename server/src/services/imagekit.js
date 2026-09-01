'use strict';

/**
 * ImageKit service wrapper.
 *
 * Provides:
 *   uploadFile({ buffer, fileName, folder, tags? })
 *     → { url, fileId }
 *
 *   deleteFile(fileId)
 *     → void
 *
 *   getSignedUrl(filePath, expireSeconds?)
 *     → signedUrl (string)
 *
 * All filenames are UUIDs so storage paths are opaque and non-guessable.
 * Folder structure: tether/{coupleId}/gallery/ | tether/{coupleId}/avatars/
 */

const ImageKit = require('imagekit');

const ik = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Upload a file buffer to ImageKit.
 *
 * @param {object} options
 * @param {Buffer} options.buffer     - File data
 * @param {string} options.fileName   - Opaque filename (UUID + ext)
 * @param {string} options.folder     - Target folder path in ImageKit
 * @param {string[]} [options.tags]   - Optional tags for filtering
 * @returns {Promise<{ url: string, fileId: string }>}
 */
async function uploadFile({ buffer, fileName, folder, tags = [] }) {
  const response = await ik.upload({
    file: buffer,
    fileName,
    folder,
    tags,
    useUniqueFileName: false, // We already generate a UUID name
    isPrivateFile: false,     // Public CDN delivery; URL security via signed URLs
  });

  return {
    url: response.url,         // ImageKit delivery URL
    fileId: response.fileId,   // ImageKit internal ID (stored for deletion)
  };
}

/**
 * Delete a file from ImageKit by its fileId.
 *
 * @param {string} fileId - ImageKit fileId
 */
async function deleteFile(fileId) {
  if (!fileId) return;
  try {
    await ik.deleteFile(fileId);
  } catch (err) {
    // Log but don't throw — deletion is best-effort on cleanup
    console.error('[ImageKit] deleteFile failed:', fileId, err.message);
  }
}

/**
 * Generate a signed URL for a given ImageKit file path with a TTL.
 * This makes the URL time-limited so even if leaked it expires.
 *
 * @param {string} filePath    - Path within ImageKit (e.g. tether/abc123/gallery/img.jpg)
 * @param {number} [expiresIn] - TTL in seconds (default 3600 = 1 hour)
 * @returns {string} Signed URL
 */
function getSignedUrl(filePath, expiresIn = 3600) {
  const expireAt = Math.floor(Date.now() / 1000) + expiresIn;
  return ik.url({
    path: filePath,
    signed: true,
    expireSeconds: expireAt,
  });
}

module.exports = { uploadFile, deleteFile, getSignedUrl };
