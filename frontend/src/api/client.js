import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Extracts a user-readable error message from any backend response shape:
//   - { message: "..." }                        (auth middleware)
//   - { errors: ["title is required", ...] }   (validation)
//   - { error: { message: "...", statusCode } } (errorHandler)
//   - network failure (no response at all)
export function errorMessage(err, fallback = 'Something went wrong.') {
  if (!err) return fallback;
  const data = err.response?.data;
  if (!data) return err.message || fallback;
  if (typeof data === 'string') return data;
  if (Array.isArray(data.errors) && data.errors.length) return data.errors.join(', ');
  if (data.message) return data.message;
  if (data.error?.message) return data.error.message;
  return fallback;
}

// Token getter — set by AuthContext when Auth0 is ready
let getAccessToken = null;

export function setTokenGetter(fn) {
  getAccessToken = fn;
}

// Attach Auth0 access token to every request
apiClient.interceptors.request.use(async (config) => {
  if (getAccessToken) {
    try {
      const token = await getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      // User not logged in — send request without token
    }
  }
  return config;
});

export default apiClient;
