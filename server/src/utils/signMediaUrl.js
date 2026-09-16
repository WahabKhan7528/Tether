'use strict';

const { getSignedUrl } = require('../services/imagekit');

/**
 * Signs a media URL if it belongs to ImageKit.
 * ImageKit URLs typically contain the ImageKit URL endpoint.
 *
 * @param {string} url - The URL to sign
 * @param {number} expiresIn - Expiry time in seconds (default 3600 = 1 hour)
 * @returns {string} The signed URL, or original URL if not supported
 */
function signMediaUrl(url, expiresIn = 3600) {
  if (!url) return url;
  
  const ikEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  
  // If it's an ImageKit URL, we extract the path and sign it
  if (ikEndpoint && url.startsWith(ikEndpoint)) {
    try {
      const path = url.replace(ikEndpoint, '').replace(/^\/+/, '');
      return getSignedUrl(path, expiresIn);
    } catch (err) {
      console.error('[signMediaUrl] Error signing URL:', err);
      return url;
    }
  }

  // Fallback for local / uploads URLs (not signed)
  return url;
}

module.exports = signMediaUrl;
