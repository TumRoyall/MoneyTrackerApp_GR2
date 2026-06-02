import { Stack } from 'expo-router';

export default function ToolsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="budgets/index" />
      <Stack.Screen name="budgets/[budgetId]" />
      <Stack.Screen name="budgets/[budgetId]/edit" />
      <Stack.Screen name="savings/index" />
      <Stack.Screen name="savings/[savingId]" />
      <Stack.Screen name="savings/[savingId]/edit" />
      <Stack.Screen name="debts/index" />
      <Stack.Screen name="debts/[debtId]" />
      <Stack.Screen name="debts/[debtId]/edit" />
      <Stack.Screen name="events/index" />
      <Stack.Screen name="events/[eventId]" />
    </Stack>
  );
}
