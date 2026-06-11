import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const LAST_WALLET_KEY = 'ai_last_wallet_id';

let lastWalletFallback: string | null = null;

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

export const walletStorage = {
  async getLastWalletId() {
    if (isWeb) {
      return getWebItem(LAST_WALLET_KEY);
    }
    return safeSecureStoreCall(
      () => SecureStore.getItemAsync(LAST_WALLET_KEY),
      () => lastWalletFallback,
    );
  },
  async setLastWalletId(walletId: string) {
    if (isWeb) {
      setWebItem(LAST_WALLET_KEY, walletId);
      return;
    }
    return safeSecureStoreCall(
      () => SecureStore.setItemAsync(LAST_WALLET_KEY, walletId),
      () => {
        lastWalletFallback = walletId;
      },
    );
  },
  async clear() {
    if (isWeb) {
      deleteWebItem(LAST_WALLET_KEY);
      return;
    }
    await safeSecureStoreCall(
      () => SecureStore.deleteItemAsync(LAST_WALLET_KEY),
      () => {
        lastWalletFallback = null;
      },
    );
  },
};
