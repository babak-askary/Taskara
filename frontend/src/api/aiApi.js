import apiClient from './client';

export const ask = (prompt) => apiClient.post('/ai/ask', { prompt });
