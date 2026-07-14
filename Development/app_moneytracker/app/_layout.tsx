import { Stack, useSegments } from 'expo-router';
import { QueryProvider } from '@/core/providers/QueryProvider';
import { useStreakNotification } from '@/shared/hooks/useStreakNotification';
import { useSyncBootstrap } from '@/modules/sync/hooks/useSyncBootstrap';

export default function RootLayout() {
  useStreakNotification();
  useSyncBootstrap();
  const segments = useSegments();

  return (
    <QueryProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ai-companion" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </QueryProvider>
  );
}
