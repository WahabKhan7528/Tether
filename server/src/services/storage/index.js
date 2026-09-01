'use strict';

/**
 * Storage service factory.
 *
 * imageStorage   → ImageKitProvider      (ImageKit CDN, recommended for images)
 * audioStorage   → ImageKitProvider      (ImageKit CDN, used for large files)
 */

const imageStorage = require('./imagekitProvider');
const audioStorage = require('./imagekitProvider');

module.exports = {
  imageStorage,
  audioStorage
};
