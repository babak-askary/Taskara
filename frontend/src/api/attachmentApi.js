import apiClient from './client';

export const getAttachments = (taskId) =>
  apiClient.get(`/tasks/${taskId}/attachments`);

export const uploadAttachment = (taskId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post(`/tasks/${taskId}/attachments`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteAttachment = (taskId, attachmentId) =>
  apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
