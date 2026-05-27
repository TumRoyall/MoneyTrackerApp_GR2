import { Stack, useSegments } from 'expo-router';
import { QueryProvider } from '@/core/providers/QueryProvider';
import { useStreakNotification } from '@/shared/hooks/useStreakNotification';

export default function RootLayout() {
  useStreakNotification();
  const segments = useSegments();

  return (
    <QueryProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ai-companion" />
      </Stack>
    </QueryProvider>
  );
}
