import apiClient from './client';

// Pass the browser's IANA timezone so the model can talk about due dates
// in the user's local time instead of raw UTC.
const browserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const ask = (prompt) =>
  apiClient.post('/ai/ask', { prompt, timezone: browserTimezone() });
