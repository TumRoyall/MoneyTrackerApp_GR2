import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Animated } from 'react-native';
import { useOnboarding, OnboardingStep } from '@/modules/onboarding/hooks/useOnboarding';
import { StepIndicator } from '@/modules/onboarding/components/StepIndicator';
import { WelcomeStep } from '@/modules/onboarding/components/WelcomeStep';
import { UserTypeStep } from '@/modules/onboarding/components/UserTypeStep';
import { IncomeStep } from '@/modules/onboarding/components/IncomeStep';
import { ExpensesStep } from '@/modules/onboarding/components/ExpensesStep';
import { SavingsStep } from '@/modules/onboarding/components/SavingsStep';
import { CompletionStep } from '@/modules/onboarding/components/CompletionStep';

const STEP_COMPONENTS: Record<OnboardingStep, React.FC<any>> = {
  welcome: WelcomeStep,
  userType: UserTypeStep,
  income: IncomeStep,
  expenses: ExpensesStep,
  savings: SavingsStep,
  completion: CompletionStep,
};

const STEP_PROPS: Record<OnboardingStep, string[]> = {
  welcome: [],
  userType: ['selected', 'onSelect', 'onNext', 'onBack'],
  income: ['selected', 'onSelect', 'onNext', 'onBack'],
  expenses: ['selected', 'onToggle', 'onNext', 'onBack'],
  savings: ['selected', 'onSelect', 'onApply503020', 'onNext', 'onBack'],
  completion: ['onComplete', 'onBack', 'isSaving'],
};

export default function OnboardingScreen() {
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    data,
    isSaving,
    goToNextStep,
    goToPrevStep,
    setUserType,
    setIncomeRange,
    toggleExpenseCategory,
    setSavingTargetPercent,
    apply503020,
    completeOnboarding,
  } = useOnboarding();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStepIndex, fadeAnim, slideAnim]);

  const StepComponent = STEP_COMPONENTS[currentStep];

  const getStepProps = () => {
    switch (currentStep) {
      case 'welcome':
        return { onNext: goToNextStep };
      case 'userType':
        return {
          selected: data.userType,
          onSelect: setUserType,
          onNext: goToNextStep,
          onBack: goToPrevStep,
        };
      case 'income':
        return {
          selected: data.incomeRange,
          onSelect: setIncomeRange,
          onNext: goToNextStep,
          onBack: goToPrevStep,
        };
      case 'expenses':
        return {
          selected: data.selectedExpenseCategories,
          onToggle: toggleExpenseCategory,
          onNext: goToNextStep,
          onBack: goToPrevStep,
        };
      case 'savings':
        return {
          selected: data.savingTargetPercent,
          onSelect: setSavingTargetPercent,
          onApply503020: apply503020,
          onNext: goToNextStep,
          onBack: goToPrevStep,
        };
      case 'completion':
        return {
          onComplete: completeOnboarding,
          onBack: goToPrevStep,
          isSaving,
        };
      default:
        return {};
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f1fbfd" />
      {currentStepIndex > 0 && currentStepIndex < totalSteps - 1 && (
        <StepIndicator currentStep={currentStepIndex} totalSteps={totalSteps} />
      )}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <StepComponent {...getStepProps()} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1fbfd',
  },
  content: {
    flex: 1,
  },
});
