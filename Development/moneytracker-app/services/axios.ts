import axios from "axios";
import { router } from "expo-router";
import { getToken, removeToken } from "./auth.storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ===== Request interceptor: gắn token =====
api.interceptors.request.use(async (config) => {
  const token = await getToken(); // SecureStore
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== Response interceptor: token hết hạn =====
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";

    // KHÔNG chặn login / register
    if (status === 401 && !url.startsWith("/api/auth")) {
      await removeToken();
      router.replace("/(auth)/login");
    }

    return Promise.reject(error);
  }
);

export default api;
