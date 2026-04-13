import apiClient from './client';

export const getStats = () => apiClient.get('/dashboard/stats');
export const getPerformance = () => apiClient.get('/dashboard/performance');
