import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, View } from 'react-native';

import { AuthButton, AuthMessage, AuthTextInput } from '@/modules/auth/components';
import { ChangePasswordFormValues } from '@/modules/auth/models/auth.types';
import { authStyles } from '@/modules/auth/screens/authStyles';
import { useAuthAction } from '@/modules/auth/screens/useAuthAction';
import { useAuthUsecases } from '@/modules/auth/usecases';
import { changePasswordSchema } from '@/modules/auth/validation';

export const ChangePasswordScreen = () => {
  const { changePassword } = useAuthUsecases();
  const { run, loading, error, success } = useAuthAction(changePassword);

  const { control, handleSubmit } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await run({ currentPassword: values.currentPassword, newPassword: values.newPassword });
  });

  return (
    <ScrollView contentContainerStyle={authStyles.container} keyboardShouldPersistTaps="handled">
      <View style={authStyles.header}>
        <Text style={authStyles.title}>Doi mat khau</Text>
        <Text style={authStyles.subtitle}>Cap nhat mat khau de bao mat tai khoan.</Text>
      </View>

      {error ? <AuthMessage message={error} variant="error" /> : null}
      {success ? <AuthMessage message="Da cap nhat mat khau." variant="success" /> : null}

      <View style={authStyles.form}>
        <Controller
          control={control}
          name="currentPassword"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <AuthTextInput
              label="Mat khau hien tai"
              placeholder="Nhap mat khau hien tai"
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
        <AuthButton label="Cap nhat mat khau" onPress={onSubmit} loading={loading} />
      </View>
    </ScrollView>
  );
};
