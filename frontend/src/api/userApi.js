import apiClient from './client';

export const searchUsers = (search, limit = 8) =>
  apiClient.get('/users', { params: { search, limit } });

export const updateProfile = (userId, fields) =>
  apiClient.put(`/users/${userId}`, fields);
