import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { httpClient } from '@/core/api/httpClient';
import { tokenStorage } from '@/core/storage/tokenStorage';

// ============================================================
// DEV AUTO-LOGIN — set to false to go back to normal login flow
// ============================================================
const DEV_AUTO_LOGIN = true;
const DEV_EMAIL = 'nguyenkimngochtm@gmail.com';
const DEV_PASSWORD = 'admin';

export default function IndexScreen() {
  const [ready, setReady] = useState(!DEV_AUTO_LOGIN);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!DEV_AUTO_LOGIN) return;

    (async () => {
      try {
        // Check if we already have a valid token
        const existingToken = await tokenStorage.getAccessToken();
        if (existingToken) {
          setReady(true);
          return;
        }

        // Auto-login with dev credentials
        const response = await httpClient.post('/api/auth/login', {
          email: DEV_EMAIL,
          password: DEV_PASSWORD,
        });
        const token = response.data?.data?.token;
        if (token) {
          await tokenStorage.setAccessToken(token);
        }
        setReady(true);
      } catch (e) {
        console.warn('[DEV] Auto-login failed, falling back to login screen:', e);
        setFailed(true);
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1fbfd' }}>
        <ActivityIndicator size="large" color="#29bcc8" />
      </View>
    );
  }

  // If auto-login succeeded → go to tabs; if failed → go to login
  if (DEV_AUTO_LOGIN && !failed) {
    return <Redirect href="/(tabs)/wallets" />;
  }

  return <Redirect href="/(auth)/login" />;
}
