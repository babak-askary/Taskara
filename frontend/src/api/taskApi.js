import apiClient from './client';

export const getTasks = () => apiClient.get('/tasks');
export const getTaskById = (id) => apiClient.get(`/tasks/${id}`);
export const createTask = (data) => apiClient.post('/tasks', data);
export const updateTask = (id, data) => apiClient.put(`/tasks/${id}`, data);
export const deleteTask = (id) => apiClient.delete(`/tasks/${id}`);
export const searchTasks = (query) => apiClient.get('/tasks/search', { params: { q: query } });
export const addComment = (taskId, data) => apiClient.post(`/tasks/${taskId}/comments`, data);
export const addAttachment = (taskId, formData) =>
  apiClient.post(`/tasks/${taskId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
