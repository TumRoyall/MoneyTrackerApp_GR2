import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AuthButton, AuthMessage, AuthTextInput } from '@/modules/auth/components';
import { RegisterFormValues } from '@/modules/auth/models/auth.types';
import { authStyles } from '@/modules/auth/screens/authStyles';
import { useAuthAction } from '@/modules/auth/screens/useAuthAction';
import { useAuthUsecases } from '@/modules/auth/usecases';
import { registerSchema } from '@/modules/auth/validation';

export const RegisterScreen = () => {
  const { register, checkEmail } = useAuthUsecases();
  const registerAction = useAuthAction(register);
  const checkEmailAction = useAuthAction(checkEmail);

  const { control, handleSubmit, getValues } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await registerAction.run({
      email: values.email,
      password: values.password,
      fullname: values.fullName,
    });
  });

  const onCheckEmail = async () => {
    const email = getValues('email');
    if (!email) {
      checkEmailAction.reset();
      return;
    }
    await checkEmailAction.run(email);
  };

  const checkEmailMessage = checkEmailAction.data
    ? checkEmailAction.data.exists
      ? 'Email da ton tai.'
      : 'Email co the su dung.'
    : undefined;

  return (
    <ScrollView contentContainerStyle={authStyles.container} keyboardShouldPersistTaps="handled">
      <View style={authStyles.header}>
        <Text style={authStyles.title}>Tao tai khoan</Text>
        <Text style={authStyles.subtitle}>Dang ky de bat dau quan ly chi tieu.</Text>
      </View>

      {registerAction.error ? <AuthMessage message={registerAction.error} variant="error" /> : null}
      {registerAction.success ? (
        <AuthMessage message="Vui long kiem tra email de xac thuc tai khoan." variant="success" />
      ) : null}
      {checkEmailAction.error ? <AuthMessage message={checkEmailAction.error} variant="error" /> : null}
      {checkEmailMessage ? (
        <AuthMessage
          message={checkEmailMessage}
          variant={checkEmailAction.data?.exists ? 'error' : 'info'}
        />
      ) : null}

      <View style={authStyles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <AuthTextInput
              label="Ho va ten"
              placeholder="Ten cua ban"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              autoCapitalize="words"
            />
          )}
        />
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
              placeholder="Tao mat khau"
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
              label="Xac nhan mat khau"
              placeholder="Nhap lai mat khau"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              secureTextEntry
            />
          )}
        />

        <AuthButton label="Dang ky" onPress={onSubmit} loading={registerAction.loading} />
        <AuthButton
          label="Kiem tra email"
          onPress={onCheckEmail}
          loading={checkEmailAction.loading}
          variant="secondary"
        />
      </View>

      <View style={authStyles.footer}>
        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={authStyles.link}>Da co tai khoan? Dang nhap</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
