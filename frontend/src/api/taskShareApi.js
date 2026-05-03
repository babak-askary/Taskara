import apiClient from './client';

export const getShares = (taskId) => apiClient.get(`/tasks/${taskId}/shares`);
export const shareTask = (taskId, { user_id, permission }) =>
  apiClient.post(`/tasks/${taskId}/share`, { user_id, permission });
export const unshareTask = (taskId, userId) =>
  apiClient.delete(`/tasks/${taskId}/share/${userId}`);
