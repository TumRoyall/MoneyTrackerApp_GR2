import { zodResolver } from '@hookform/resolvers/zod';
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthMessage } from '@/modules/auth/components';
import { RegisterFormValues } from '@/modules/auth/models/auth.types';
import { useAuthAction } from '@/modules/auth/screens/useAuthAction';
import { useAuthUsecases } from '@/modules/auth/usecases';
import { registerSchema } from '@/modules/auth/validation';

export const RegisterScreen = () => {
  const { register } = useAuthUsecases();
  const { run, loading, error, success } = useAuthAction(register);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeNewsletter, setAgreeNewsletter] = useState(false);

  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await run({
      email: values.email,
      password: values.password,
      fullname: values.fullName,
    });
  });

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.heroSection}>
        <View style={styles.robotCircle}>
          <Ionicons name="sparkles" size={36} color="#2bbcc5" />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Bắt đầu</Text>
          <Text style={styles.subtitle}>Hãy bắt đầu bằng cách điền vào mẫu dưới đây.</Text>
        </View>

        {error ? <AuthMessage message={error} variant="error" /> : null}
        {success ? <AuthMessage message="Vui lòng kiểm tra email để xác thực tài khoản." variant="success" /> : null}

        <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, fieldState.error ? styles.inputError : null]}
                  placeholder="Họ và tên"
                  placeholderTextColor="#9a9a9a"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                />
                {fieldState.error ? <Text style={styles.errorText}>{fieldState.error.message}</Text> : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, fieldState.error ? styles.inputError : null]}
                  placeholder="E-mail"
                  placeholderTextColor="#9a9a9a"
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

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <View style={styles.inputGroup}>
                <View style={[styles.passwordWrap, fieldState.error ? styles.inputError : null]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Mật khẩu"
                    placeholderTextColor="#9a9a9a"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.eyeButton}>
                    <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#8d8d8d" />
                  </Pressable>
                </View>
                {fieldState.error ? <Text style={styles.errorText}>{fieldState.error.message}</Text> : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <View style={styles.inputGroup}>
                <View style={[styles.passwordWrap, fieldState.error ? styles.inputError : null]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Xác nhận mật khẩu"
                    placeholderTextColor="#9a9a9a"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((current) => !current)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#8d8d8d"
                    />
                  </Pressable>
                </View>
                {fieldState.error ? <Text style={styles.errorText}>{fieldState.error.message}</Text> : null}
              </View>
            )}
          />

          <Pressable onPress={onSubmit} disabled={loading} style={[styles.primaryButton, loading ? styles.disabled : null]}>
            <Text style={styles.primaryButtonText}>{loading ? 'Đang xử lý...' : 'Tạo tài khoản'}</Text>
          </Pressable>

          <Text style={styles.separator}>HOẶC</Text>

          <Pressable style={styles.socialButton}>
            <AntDesign name="google" size={24} color="#111" />
            <Text style={styles.socialButtonText}>Tiếp tục với Google</Text>
          </Pressable>

          <Pressable style={styles.socialButton}>
            <FontAwesome name="apple" size={26} color="#111" />
            <Text style={styles.socialButtonText}>Tiếp tục với Apple</Text>
          </Pressable>

          <Pressable style={styles.checkboxRow} onPress={() => setAgreeNewsletter((current) => !current)}>
            <View style={[styles.checkboxBase, agreeNewsletter ? styles.checkboxChecked : null]}>
              {agreeNewsletter ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
            </View>
            <Text style={styles.checkboxText}>
              Tôi muốn đăng ký nhận bản tin và nhận thông tin cập nhật, mẹo và ưu đãi độc quyền.
            </Text>
          </Pressable>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Bạn đã có tài khoản? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.bottomLink}>Đăng nhập tại đây</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#f1fbfd',
    paddingBottom: 24,
  },
  heroSection: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f8fb',
  },
  robotCircle: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  card: {
    marginTop: -14,
    marginHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#fff',
    paddingVertical: 28,
    paddingHorizontal: 18,
    gap: 16,
    shadowColor: '#111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 62,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7d7d7d',
    textAlign: 'center',
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  input: {
    height: 60,
    borderWidth: 1,
    borderColor: '#dedede',
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 18,
    color: '#101010',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dedede',
    borderRadius: 16,
    height: 60,
    paddingLeft: 18,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 18,
    color: '#101010',
  },
  eyeButton: {
    padding: 6,
  },
  inputError: {
    borderColor: '#e14343',
  },
  errorText: {
    color: '#e14343',
    fontSize: 12,
  },
  primaryButton: {
    height: 60,
    borderRadius: 16,
    backgroundColor: '#29bcc8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  disabled: {
    opacity: 0.65,
  },
  separator: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginVertical: 2,
  },
  socialButton: {
    height: 60,
    borderWidth: 1,
    borderColor: '#dfdfdf',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
  },
  socialButtonText: {
    fontSize: 16,
    color: '#232323',
    fontWeight: '500',
  },
  checkboxRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxBase: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d7dce0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#29bcc8',
    borderColor: '#29bcc8',
  },
  checkboxText: {
    flex: 1,
    fontSize: 15,
    color: '#767676',
    lineHeight: 21,
  },
  bottomRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomText: {
    fontSize: 16,
    color: '#4f4f4f',
  },
  bottomLink: {
    fontSize: 16,
    color: '#22b8c3',
    fontWeight: '700',
  },
});
