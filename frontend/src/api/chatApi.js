import apiClient from './client';

export const listConversations = () => apiClient.get('/chat/conversations');
export const getConversation = (id) => apiClient.get(`/chat/conversations/${id}`);
export const listMessages = (id, params) => apiClient.get(`/chat/conversations/${id}/messages`, { params });
export const sendMessage = (id, body) => apiClient.post(`/chat/conversations/${id}/messages`, { body });
export const startDirect = (email) => apiClient.post('/chat/conversations/direct', { email });
export const getGroupConversation = (groupId) => apiClient.get(`/chat/conversations/group/${groupId}`);
