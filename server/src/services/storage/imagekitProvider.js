'use strict';

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadFile, deleteFile } = require('../imagekit');

/**
 * ImageKit storage provider.
 * Implements the same interface as localProvider and r2Provider.
 *
 * mode: 'imagekit'
 *
 * uploadBuffer({ buffer, originalname, mimetype, folder })
 *   → { url, key }   where key = ImageKit fileId (used for deletion)
 *
 * deleteFiles(fileIds[])
 *   → void
 */

const mode = 'imagekit';

/**
 * Upload a file buffer to ImageKit.
 *
 * @param {object} opts
 * @param {Buffer}  opts.buffer        - File data
 * @param {string}  opts.originalname  - Original filename (ext extracted)
 * @param {string}  opts.folder        - Destination folder in ImageKit (e.g. tether/{coupleId}/gallery)
 * @returns {Promise<{ url: string, key: string }>}
 */
async function uploadBuffer({ buffer, originalname, folder }) {
  const ext = path.extname(originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg';
  const fileName = `${uuidv4()}${ext}`;

  const { url, fileId } = await uploadFile({ buffer, fileName, folder });

  return {
    url,
    key: fileId, // store fileId as the key for future deletion
  };
}

/**
 * Delete one or more files from ImageKit by their fileIds.
 *
 * @param {string[]} fileIds
 */
async function deleteFiles(fileIds = []) {
  await Promise.allSettled(fileIds.map((id) => deleteFile(id)));
}

module.exports = { mode, uploadBuffer, deleteFiles };
