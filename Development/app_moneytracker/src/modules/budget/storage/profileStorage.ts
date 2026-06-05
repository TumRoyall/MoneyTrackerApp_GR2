import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PROFILE_KEY = 'ai_budget_profile';

let inMemoryProfile: string | null = null;

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

export interface AiBudgetProfile {
  lastIncome?: number;
  lastPrompt?: string;
  lastWalletId?: string | null;
  updatedAt: string;
}

export const profileStorage = {
  async get(): Promise<AiBudgetProfile | null> {
    const raw = isWeb
      ? getWebItem(PROFILE_KEY)
      : await safeSecureStoreCall(() => SecureStore.getItemAsync(PROFILE_KEY), () => inMemoryProfile);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AiBudgetProfile;
    } catch {
      return null;
    }
  },

  async save(profile: AiBudgetProfile): Promise<void> {
    const value = JSON.stringify(profile);
    if (isWeb) {
      setWebItem(PROFILE_KEY, value);
      return;
    }
    await safeSecureStoreCall(
      () => SecureStore.setItemAsync(PROFILE_KEY, value),
      () => {
        inMemoryProfile = value;
      },
    );
  },

  async clear(): Promise<void> {
    if (isWeb) {
      deleteWebItem(PROFILE_KEY);
      return;
    }
    await safeSecureStoreCall(
      async () => {
        await SecureStore.deleteItemAsync(PROFILE_KEY);
      },
      () => {
        inMemoryProfile = null;
      },
    );
  },
};
