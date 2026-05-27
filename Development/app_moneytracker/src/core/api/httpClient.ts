import axios from 'axios';
import { ENV } from '@/core/config/env';
import { tokenStorage } from '@/core/storage/tokenStorage';

export const httpClient = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

httpClient.interceptors.response.use(async (response) => {
  const method = response.config.method?.toUpperCase();
  if (method && ['POST', 'PUT', 'DELETE'].includes(method)) {
    // Exclude the activity endpoint itself to avoid infinite loops
    if (response.config.url && !response.config.url.includes('/api/streaks/activity')) {
      try {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          // Send background request directly using fetch/axios without triggering another interceptor response hook
          axios.post(`${ENV.apiBaseUrl}/api/streaks/activity`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {});
        }
      } catch (e) {
        // silent fail
      }
    }
  }
  return response;
});
