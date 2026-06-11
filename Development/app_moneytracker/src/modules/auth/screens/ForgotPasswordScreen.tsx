import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthMessage } from '@/modules/auth/components';
import { ForgotPasswordFormValues } from '@/modules/auth/models/auth.types';
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
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={34} color="#1f1f1f" />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Quên mật khẩu</Text>
        <Text style={styles.subtitle}>
          Chúng tôi sẽ gửi cho bạn email có liên kết để đặt lại mật khẩu, vui lòng nhập email được
          liên kết với tài khoản của bạn bên dưới.
        </Text>
      </View>

      {error ? <AuthMessage message={error} variant="error" /> : null}
      {success ? <AuthMessage message="Đã gửi email đặt lại mật khẩu." variant="success" /> : null}

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, fieldState.error ? styles.inputError : null]}
                placeholder="Địa chỉ email của bạn..."
                placeholderTextColor="#909090"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {fieldState.error ? <Text style={styles.errorText}>{fieldState.error.message}</Text> : null}
            </View>
          )}
        />

        <Pressable onPress={onSubmit} disabled={loading} style={[styles.primaryButton, loading ? styles.disabled : null]}>
          <Text style={styles.primaryButtonText}>{loading ? 'Đang gửi...' : 'Gửi liên kết'}</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.backToLogin}>Quay lại đăng nhập</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#f4f4f6',
    paddingHorizontal: 18,
    paddingTop: 78,
    paddingBottom: 28,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  header: {
    gap: 8,
    marginBottom: 26,
  },
  title: {
    fontSize: 50,
    fontWeight: '800',
    color: '#1f1f1f',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 23,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  input: {
    height: 86,
    borderWidth: 1,
    borderColor: '#d9dde2',
    borderRadius: 20,
    paddingHorizontal: 26,
    fontSize: 18,
    color: '#1a1a1a',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#df5050',
  },
  errorText: {
    fontSize: 12,
    color: '#df5050',
  },
  primaryButton: {
    height: 86,
    borderRadius: 20,
    backgroundColor: '#29bcc8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
  backToLogin: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#22b8c3',
  },
});
