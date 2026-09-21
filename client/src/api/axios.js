import axios from 'axios';
import { normalizeMediaUrlsDeep } from '../utils/normalizeMediaUrl';

/**
 * Axios instance configured for Tether's cookie-based auth.
 *
 * Key decisions:
 *   - withCredentials: true  → sends HttpOnly cookies on every request
 *   - No Authorization header or localStorage token management
 *   - 401 responses trigger a silent /auth/refresh call; if that also fails,
 *     dispatches 'auth:logout' event so AuthContext can clear state
 */
const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api/v1' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'),
  withCredentials: true,  // Required for HttpOnly cookie-based sessions
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
// We forward the X-Request-ID echo header from the server for tracing.
// For state-mutating requests (POST, PATCH, DELETE, PUT), we fetch and append the CSRF token.

let csrfToken = null;

api.interceptors.request.use(
  async (config) => {
    // Only attach CSRF token to mutating requests
    const isMutating = ['post', 'patch', 'put', 'delete'].includes(config.method?.toLowerCase());

    // Skip fetching CSRF token for endpoints that generate it or don't need it initially
    const isExemptRoute = config.url?.includes('/csrf-token') || config.url?.includes('/auth/login') || config.url?.includes('/auth/signup') || config.url?.includes('/auth/refresh');

    if (isMutating && !isExemptRoute) {
      if (!csrfToken) {
        try {
          // Fetch token using a distinct axios instance or by bypassing the interceptor
          const res = await axios.get(`${api.defaults.baseURL}/csrf-token`, {
            withCredentials: true,
          });
          csrfToken = res.data?.data?.csrfToken;
        } catch (err) {
          console.error('[CSRF] Failed to fetch token', err);
        }
      }
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — silent session refresh on 401 ─────────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => {
    // Rewrite any stale localhost:5000/uploads/... URLs that were persisted in the
    // DB during local development so they resolve correctly in production.
    // Ensure we skip this for Blob responses (like audio streaming) to prevent corrupting them.
    if (import.meta.env.PROD && response.data && response.config.responseType !== 'blob' && !(response.data instanceof Blob)) {
      response.data = normalizeMediaUrlsDeep(response.data);
    }
    return response;
  },
  async (error) => {
    const original = error.config;

    // Only attempt refresh once per failed request, and not for auth routes themselves
    const isAuthRoute = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue the request until the in-flight refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(original))
          .catch(Promise.reject);
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh — server rotates both cookies silently
        await api.post('/auth/refresh');
        processQueue(null);
        return api(original); // Retry the original request
      } catch (refreshError) {
        processQueue(refreshError);
        // Both access and refresh tokens are invalid — force logout
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle CSRF Token Expiration/Invalidation
    if (error.response?.status === 403 && (error.response?.data?.code === 'EBADCSRFTOKEN' || error.response?.data?.message === 'invalid csrf token') && !original._retryCsrf) {
      original._retryCsrf = true;
      csrfToken = null; // Clear the cached token
      
      return new Promise((resolve, reject) => {
        // Fetch a new token and retry the request
        axios.get(`${api.defaults.baseURL}/csrf-token`, { withCredentials: true })
          .then((res) => {
            csrfToken = res.data?.data?.csrfToken;
            if (csrfToken) {
              original.headers['X-CSRF-Token'] = csrfToken;
            }
            resolve(api(original));
          })
          .catch(() => {
            reject(error); // If we can't get a new token, reject with the original error
          });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
