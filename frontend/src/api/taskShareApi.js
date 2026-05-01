import apiClient from './client';

export const getSharedUsers = (taskId) =>
  apiClient.get(`/tasks/${taskId}/shares`);

export const shareTask = (taskId, userId, permission = 'view') =>
  apiClient.post(`/tasks/${taskId}/share`, { user_id: userId, permission });

export const unshareTask = (taskId, userId) =>
  apiClient.delete(`/tasks/${taskId}/share/${userId}`);
