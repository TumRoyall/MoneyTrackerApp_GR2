import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { OnboardingData, DEFAULT_ONBOARDING_DATA, UserType, IncomeRange } from '../models/onboarding.types';
import { onboardingStorage } from '../storage/onboardingStorage';

export type OnboardingStep = 'welcome' | 'userType' | 'income' | 'expenses' | 'savings' | 'completion';

const STEP_ORDER: OnboardingStep[] = ['welcome', 'userType', 'income', 'expenses', 'savings', 'completion'];

export const useOnboarding = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const storedData = await onboardingStorage.getData();
      setData(storedData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const currentStep = STEP_ORDER[currentStepIndex];

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < STEP_ORDER.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex]);

  const goToPrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const setUserType = useCallback((userType: UserType) => {
    updateData({ userType });
  }, [updateData]);

  const setIncomeRange = useCallback((incomeRange: IncomeRange) => {
    updateData({ incomeRange });
  }, [updateData]);

  const toggleExpenseCategory = useCallback((categoryId: string) => {
    setData((prev) => {
      const isSelected = prev.selectedExpenseCategories.includes(categoryId);
      return {
        ...prev,
        selectedExpenseCategories: isSelected
          ? prev.selectedExpenseCategories.filter((id) => id !== categoryId)
          : [...prev.selectedExpenseCategories, categoryId],
      };
    });
  }, []);

  const setSavingTargetPercent = useCallback((percent: number) => {
    updateData({ savingTargetPercent: percent });
  }, [updateData]);

  const apply503020 = useCallback(() => {
    setSavingTargetPercent(20);
  }, [setSavingTargetPercent]);

  const completeOnboarding = useCallback(async () => {
    setIsSaving(true);
    try {
      await onboardingStorage.saveData({
        ...data,
        isCompleted: true,
        completedAt: new Date().toISOString(),
      });
      router.replace('/(tabs)/wallets');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSaving(false);
    }
  }, [data]);

  const resetOnboarding = useCallback(async () => {
    await onboardingStorage.reset();
    setData(DEFAULT_ONBOARDING_DATA);
    setCurrentStepIndex(0);
  }, []);

  const getProgress = useCallback(() => {
    return (currentStepIndex / (STEP_ORDER.length - 1)) * 100;
  }, [currentStepIndex]);

  return {
    currentStep,
    currentStepIndex,
    totalSteps: STEP_ORDER.length,
    data,
    isLoading,
    isSaving,
    progress: getProgress(),
    goToNextStep,
    goToPrevStep,
    updateData,
    setUserType,
    setIncomeRange,
    toggleExpenseCategory,
    setSavingTargetPercent,
    apply503020,
    completeOnboarding,
    resetOnboarding,
  };
};
