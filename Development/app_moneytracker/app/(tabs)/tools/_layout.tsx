import { Stack } from 'expo-router';
import { useCallback } from 'react';

export default function ToolsStackLayout() {
  const screenOptions = useCallback(() => ({
    headerShown: false,
    tabBarStyle: {
      display: 'none',
    },
  }), []);

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="budgets/index" />
      <Stack.Screen name="budgets/[budgetId]/edit" />
      <Stack.Screen name="budgets/ai-create" />
      <Stack.Screen name="budgets/ai-preview" />
      <Stack.Screen name="savings/index" />
      <Stack.Screen name="savings/[savingId]" />
      <Stack.Screen name="savings/[savingId]/edit" />
      <Stack.Screen name="debts/index" />
      <Stack.Screen name="debts/[debtId]" />
      <Stack.Screen name="debts/[debtId]/edit" />
      <Stack.Screen name="events/index" />
      <Stack.Screen name="events/[eventId]/index" />
    </Stack>
  );
}
