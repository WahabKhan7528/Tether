/**
 * normalizeMediaUrl.js
 *
 * Problem: Images uploaded during local development are stored in MongoDB with
 * absolute URLs like `http://localhost:5000/uploads/...`. When the production
 * frontend (on Vercel) tries to render these, the browser blocks them as either
 * Mixed Content (HTTP on HTTPS page) or ERR_CONNECTION_REFUSED.
 *
 * Fix: Rewrite any localhost /uploads/ URL to the actual Render backend origin.
 * This runs client-side so it automatically covers all stale DB records without
 * requiring a database migration.
 *
 * Also handles the reverse proxy path: if a URL happens to use the old relative
 * /uploads/ form, it is left as-is (the Vercel proxy doesn't cover /uploads/).
 */

const RENDER_ORIGIN = 'https://tether-l3e0.onrender.com';

// Matches http(s)://localhost:<port>/uploads/... or http(s)://127.0.0.1:<port>/uploads/...
const LOCAL_UPLOADS_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\//;

/**
 * Rewrites a stale localhost media URL to the production Render backend URL.
 * Returns the URL unchanged if it is not a local uploads URL.
 *
 * @param {string|null|undefined} url
 * @returns {string|null|undefined}
 */
export function normalizeMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;

  if (LOCAL_UPLOADS_RE.test(url)) {
    // Replace the origin+port portion with the Render origin
    return url.replace(LOCAL_UPLOADS_RE, `${RENDER_ORIGIN}/uploads/`);
  }

  return url;
}

/**
 * Recursively walks a plain object/array and normalizes any string value that
 * looks like a local uploads URL.  Safe to call on an entire API response body.
 *
 * @param {unknown} data
 * @returns {unknown}
 */
export function normalizeMediaUrlsDeep(data) {
  if (!data) return data;

  if (typeof data === 'string') {
    return normalizeMediaUrl(data);
  }

  if (Array.isArray(data)) {
    return data.map(normalizeMediaUrlsDeep);
  }

  if (typeof data === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = normalizeMediaUrlsDeep(value);
    }
    return result;
  }

  return data;
}
