import apiClient from './client';

export const login = (credentials) => apiClient.post('/auth/login', credentials);
export const register = (data) => apiClient.post('/auth/register', data);
export const getProfile = () => apiClient.get('/auth/me');
