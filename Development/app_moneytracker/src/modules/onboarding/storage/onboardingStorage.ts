import * as SecureStore from 'expo-secure-store';
import { OnboardingData, DEFAULT_ONBOARDING_DATA } from '../models/onboarding.types';

const ONBOARDING_KEY = 'onboarding_data';

const secureStoreFailedMessages = ['setValueWithKeyAsync', 'deleteValueWithKeyAsync', 'getValueWithKeyAsync'];

const isSecureStoreBridgeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return secureStoreFailedMessages.some((keyword) => message.includes(keyword));
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

// In-memory fallback for web or when SecureStore is unavailable
let inMemoryData: OnboardingData = { ...DEFAULT_ONBOARDING_DATA };

export const onboardingStorage = {
  async getData(): Promise<OnboardingData> {
    return safeSecureStoreCall(
      async () => {
        const data = await SecureStore.getItemAsync(ONBOARDING_KEY);
        if (data) {
          return JSON.parse(data) as OnboardingData;
        }
        return { ...DEFAULT_ONBOARDING_DATA };
      },
      () => ({ ...inMemoryData }),
    );
  },

  async saveData(data: OnboardingData): Promise<void> {
    return safeSecureStoreCall(
      async () => {
        await SecureStore.setItemAsync(ONBOARDING_KEY, JSON.stringify(data));
      },
      () => {
        inMemoryData = { ...data };
      },
    );
  },

  async markCompleted(): Promise<void> {
    const data = await this.getData();
    const updatedData: OnboardingData = {
      ...data,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    };
    await this.saveData(updatedData);
  },

  async reset(): Promise<void> {
    return safeSecureStoreCall(
      async () => {
        await SecureStore.deleteItemAsync(ONBOARDING_KEY);
      },
      () => {
        inMemoryData = { ...DEFAULT_ONBOARDING_DATA };
      },
    );
  },

  async isCompleted(): Promise<boolean> {
    const data = await this.getData();
    return data.isCompleted;
  },
};
