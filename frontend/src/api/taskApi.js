import apiClient from './client';

export const getTasks = (params) => apiClient.get('/tasks', { params });
export const getTaskById = (id) => apiClient.get(`/tasks/${id}`);
export const createTask = (data) => apiClient.post('/tasks', data);
export const updateTask = (id, data) => apiClient.put(`/tasks/${id}`, data);
export const deleteTask = (id) => apiClient.delete(`/tasks/${id}`);
export const searchTasks = (params) => apiClient.get('/tasks/search', { params });
export const addComment = (taskId, data) => apiClient.post(`/tasks/${taskId}/comments`, data);
export const getComments = (taskId) => apiClient.get(`/tasks/${taskId}/comments`);
