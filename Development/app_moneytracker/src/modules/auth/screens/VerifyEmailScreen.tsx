import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { AuthButton, AuthMessage, AuthTextInput } from '@/modules/auth/components';
import {
  ResendVerificationFormValues,
  VerifyEmailFormValues,
} from '@/modules/auth/models/auth.types';
import { authStyles } from '@/modules/auth/screens/authStyles';
import { useAuthAction } from '@/modules/auth/screens/useAuthAction';
import { useAuthUsecases } from '@/modules/auth/usecases';
import { resendVerificationSchema, verifyEmailSchema } from '@/modules/auth/validation';

const RESEND_COOLDOWN_SECONDS = 60;

export const VerifyEmailScreen = () => {
  const { verifyEmail, resendVerification } = useAuthUsecases();
  const verifyAction = useAuthAction(verifyEmail);
  const resendAction = useAuthAction(resendVerification);
  const [cooldown, setCooldown] = useState(0);

  const verifyForm = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { token: '' },
  });

  const resendForm = useForm<ResendVerificationFormValues>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: '' },
  });

  const onVerify = verifyForm.handleSubmit(async (values) => {
    await verifyAction.run(values.token);
  });

  const onResend = resendForm.handleSubmit(async (values) => {
    await resendAction.run(values);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  });

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  return (
    <ScrollView contentContainerStyle={authStyles.container} keyboardShouldPersistTaps="handled">
      <View style={authStyles.header}>
        <Text style={authStyles.title}>Xac thuc email</Text>
        <Text style={authStyles.subtitle}>Dan token tu email cua ban.</Text>
      </View>

      {verifyAction.error ? <AuthMessage message={verifyAction.error} variant="error" /> : null}
      {verifyAction.success ? <AuthMessage message="Da xac thuc email." variant="success" /> : null}
      {resendAction.error ? <AuthMessage message={resendAction.error} variant="error" /> : null}
      {resendAction.success ? <AuthMessage message="Da gui email xac thuc." variant="success" /> : null}

      <View style={authStyles.form}>
        <Controller
          control={verifyForm.control}
          name="token"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <AuthTextInput
              label="Token xac thuc"
              placeholder="Dan token"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              autoCapitalize="none"
            />
          )}
        />
        <AuthButton label="Xac thuc email" onPress={onVerify} loading={verifyAction.loading} />
      </View>

      <View style={authStyles.form}>
        <Text style={authStyles.subtitle}>Gui lai email xac thuc</Text>
        <Controller
          control={resendForm.control}
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
        <AuthButton
          label={cooldown > 0 ? `Gui lai sau ${cooldown}s` : 'Gui lai xac thuc'}
          onPress={onResend}
          loading={resendAction.loading}
          disabled={cooldown > 0}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
};
