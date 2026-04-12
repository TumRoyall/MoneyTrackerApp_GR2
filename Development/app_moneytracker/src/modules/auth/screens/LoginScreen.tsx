import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AuthButton, AuthMessage, AuthTextInput } from '@/modules/auth/components';
import { LoginFormValues } from '@/modules/auth/models/auth.types';
import { useAuthAction } from '@/modules/auth/screens/useAuthAction';
import { authStyles } from '@/modules/auth/screens/authStyles';
import { useAuthUsecases } from '@/modules/auth/usecases';
import { loginSchema } from '@/modules/auth/validation';

export const LoginScreen = () => {
  const { login } = useAuthUsecases();
  const { run, loading, error, success } = useAuthAction(login);

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await run(values);
    router.replace('/(tabs)/wallets');
  });

  return (
    <ScrollView contentContainerStyle={authStyles.container} keyboardShouldPersistTaps="handled">
      <View style={authStyles.header}>
        <Text style={authStyles.title}>Chao mung quay lai</Text>
        <Text style={authStyles.subtitle}>Dang nhap de tiep tuc.</Text>
      </View>

      {error ? <AuthMessage message={error} variant="error" /> : null}
      {success ? <AuthMessage message="Dang nhap thanh cong." variant="success" /> : null}

      <View style={authStyles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <AuthTextInput
              label="Email"
              placeholder="you@example.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              keyboardType="email-address"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <AuthTextInput
              label="Mat khau"
              placeholder="Nhap mat khau"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              secureTextEntry
            />
          )}
        />
        <AuthButton label="Dang nhap" onPress={onSubmit} loading={loading} />
      </View>

      <View style={authStyles.footer}>
        <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={authStyles.link}>Quen mat khau?</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text style={authStyles.link}>Tao tai khoan moi</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/verify-email')}>
          <Text style={authStyles.link}>Xac thuc email</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
