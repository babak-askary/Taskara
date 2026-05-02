import apiClient from './client';

export const getTimeEntries = (taskId) =>
  apiClient.get(`/tasks/${taskId}/time`);
export const startTimer = (taskId) =>
  apiClient.post(`/tasks/${taskId}/time/start`);
export const stopTimer = (taskId) =>
  apiClient.post(`/tasks/${taskId}/time/stop`);
export const addManualTime = (taskId, payload) =>
  apiClient.post(`/tasks/${taskId}/time/manual`, payload);
