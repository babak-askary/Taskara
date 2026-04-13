import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
