import apiClient from './client';

export const listMyGroups = () => apiClient.get('/groups');
export const searchGroups = (q, limit) => apiClient.get('/groups/search', { params: { q, limit } });
export const getGroup = (id) => apiClient.get(`/groups/${id}`);
export const createGroup = (data) => apiClient.post('/groups', data);
export const updateGroup = (id, data) => apiClient.put(`/groups/${id}`, data);
export const deleteGroup = (id) => apiClient.delete(`/groups/${id}`);
export const joinGroup = (id) => apiClient.post(`/groups/${id}/join`);
export const leaveGroup = (id) => apiClient.post(`/groups/${id}/leave`);
export const removeMember = (id, userId) => apiClient.delete(`/groups/${id}/members/${userId}`);
export const changeMemberRole = (id, userId, role) => apiClient.put(`/groups/${id}/members/${userId}`, { role });
export const getGroupTasks = (id) => apiClient.get(`/groups/${id}/tasks`);
