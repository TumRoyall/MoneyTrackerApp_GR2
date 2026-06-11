import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AuthButton, AuthMessage, AuthTextInput } from '@/modules/auth/components';
import { ResetPasswordFormValues } from '@/modules/auth/models/auth.types';
import { authStyles } from '@/modules/auth/screens/authStyles';
import { useAuthAction } from '@/modules/auth/screens/useAuthAction';
import { useAuthUsecases } from '@/modules/auth/usecases';
import { resetPasswordSchema } from '@/modules/auth/validation';

export const ResetPasswordScreen = () => {
  const { resetPassword } = useAuthUsecases();
  const { run, loading, error, success } = useAuthAction(resetPassword);

  const { control, handleSubmit } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await run({ token: values.token, newPassword: values.newPassword });
  });

  return (
    <ScrollView contentContainerStyle={authStyles.container} keyboardShouldPersistTaps="handled">
      <View style={authStyles.header}>
        <Text style={authStyles.title}>Dat lai mat khau</Text>
        <Text style={authStyles.subtitle}>Nhap token va mat khau moi.</Text>
      </View>

      {error ? <AuthMessage message={error} variant="error" /> : null}
      {success ? <AuthMessage message="Cap nhat mat khau thanh cong." variant="success" /> : null}

      <View style={authStyles.form}>
        <Controller
          control={control}
          name="token"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <AuthTextInput
              label="Token dat lai"
              placeholder="Dan token"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              autoCapitalize="none"
            />
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <AuthTextInput
              label="Mat khau moi"
              placeholder="Tao mat khau moi"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              secureTextEntry
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <AuthTextInput
              label="Xac nhan mat khau moi"
              placeholder="Nhap lai mat khau moi"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              secureTextEntry
            />
          )}
        />
        <AuthButton label="Dat lai mat khau" onPress={onSubmit} loading={loading} />
      </View>

      <View style={authStyles.footer}>
        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={authStyles.link}>Quay lai dang nhap</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
