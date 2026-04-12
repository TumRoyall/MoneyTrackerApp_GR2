import axios from 'axios';
import { ENV } from '@/core/config/env';

export const httpClient = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
