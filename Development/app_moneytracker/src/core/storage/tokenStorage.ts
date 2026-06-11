import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

let accessTokenFallback: string | null = null;
let refreshTokenFallback: string | null = null;

const secureStoreFailedMessages = ['setValueWithKeyAsync', 'deleteValueWithKeyAsync', 'getValueWithKeyAsync'];

const isSecureStoreBridgeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return secureStoreFailedMessages.some((keyword) => message.includes(keyword));
};

const isWeb = Platform.OS === 'web';

const getWebItem = (key: string) => {
  if (!isWeb || typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(key);
};

const setWebItem = (key: string, value: string) => {
  if (!isWeb || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(key, value);
};

const deleteWebItem = (key: string) => {
  if (!isWeb || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem(key);
};

const safeSecureStoreCall = async <T>(action: () => Promise<T>, fallbackAction: () => T): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    if (!isSecureStoreBridgeError(error)) {
      throw error;
    }
    console.warn('SecureStore bridge is not available. Falling back to in-memory storage.', error);
    return fallbackAction();
  }
};

export const tokenStorage = {
  async getAccessToken() {
    if (isWeb) {
      return getWebItem(ACCESS_TOKEN_KEY);
    }
    return safeSecureStoreCall(
      () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      () => accessTokenFallback,
    );
  },
  async setAccessToken(token: string) {
    if (isWeb) {
      setWebItem(ACCESS_TOKEN_KEY, token);
      return;
    }
    return safeSecureStoreCall(
      () => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
      () => {
        accessTokenFallback = token;
      },
    );
  },
  async getRefreshToken() {
    if (isWeb) {
      return getWebItem(REFRESH_TOKEN_KEY);
    }
    return safeSecureStoreCall(
      () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      () => refreshTokenFallback,
    );
  },
  async setRefreshToken(token: string) {
    if (isWeb) {
      setWebItem(REFRESH_TOKEN_KEY, token);
      return;
    }
    return safeSecureStoreCall(
      () => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
      () => {
        refreshTokenFallback = token;
      },
    );
  },
  async clear() {
    if (isWeb) {
      deleteWebItem(ACCESS_TOKEN_KEY);
      deleteWebItem(REFRESH_TOKEN_KEY);
      return;
    }
    await safeSecureStoreCall(
      async () => {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      },
      () => {
        accessTokenFallback = null;
        refreshTokenFallback = null;
      },
    );
  },
};
