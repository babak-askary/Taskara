import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL;

if (!apiBaseUrl) {
  throw new Error('Missing VITE_API_URL. Define it in frontend/.env before starting the app.');
}

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

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
