import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'device_id';

let deviceIdFallback: string | null = null;

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

const generateDeviceId = () => Crypto.randomUUID();

export const deviceStorage = {
  async getDeviceId() {
    if (isWeb) {
      return getWebItem(DEVICE_ID_KEY);
    }
    return safeSecureStoreCall(
      () => SecureStore.getItemAsync(DEVICE_ID_KEY),
      () => deviceIdFallback,
    );
  },
  async ensureDeviceId() {
    const existing = await this.getDeviceId();
    if (existing) {
      return existing;
    }
    const newId = generateDeviceId();
    if (isWeb) {
      setWebItem(DEVICE_ID_KEY, newId);
      return newId;
    }
    await safeSecureStoreCall(
      () => SecureStore.setItemAsync(DEVICE_ID_KEY, newId),
      () => {
        deviceIdFallback = newId;
      },
    );
    return newId;
  },
};
