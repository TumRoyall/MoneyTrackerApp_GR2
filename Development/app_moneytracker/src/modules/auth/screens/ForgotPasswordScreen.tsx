import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AuthButton, AuthMessage, AuthTextInput } from '@/modules/auth/components';
import { ForgotPasswordFormValues } from '@/modules/auth/models/auth.types';
import { authStyles } from '@/modules/auth/screens/authStyles';
import { useAuthAction } from '@/modules/auth/screens/useAuthAction';
import { useAuthUsecases } from '@/modules/auth/usecases';
import { forgotPasswordSchema } from '@/modules/auth/validation';

export const ForgotPasswordScreen = () => {
  const { forgotPassword } = useAuthUsecases();
  const { run, loading, error, success } = useAuthAction(forgotPassword);

  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await run(values);
  });

  return (
    <ScrollView contentContainerStyle={authStyles.container} keyboardShouldPersistTaps="handled">
      <View style={authStyles.header}>
        <Text style={authStyles.title}>Quen mat khau</Text>
        <Text style={authStyles.subtitle}>Chung toi se gui huong dan dat lai mat khau qua email.</Text>
      </View>

      {error ? <AuthMessage message={error} variant="error" /> : null}
      {success ? <AuthMessage message="Da gui email dat lai mat khau." variant="success" /> : null}

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
        <AuthButton label="Gui email dat lai mat khau" onPress={onSubmit} loading={loading} />
      </View>

      <View style={authStyles.footer}>
        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={authStyles.link}>Quay lai dang nhap</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/reset-password')}>
          <Text style={authStyles.link}>Da co token dat lai?</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
