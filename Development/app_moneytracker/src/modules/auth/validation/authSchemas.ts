import { z } from 'zod';

const passwordSchema = z.string().min(1, 'Mat khau la bat buoc');

export const loginSchema = z.object({
  email: z.string().min(1, 'Email la bat buoc').email('Email khong hop le'),
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    email: z.string().min(1, 'Email la bat buoc').email('Email khong hop le'),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    fullName: z.string().min(1, 'Ho va ten la bat buoc'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Mat khau khong khop',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email la bat buoc').email('Email khong hop le'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token la bat buoc'),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Mat khau khong khop',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Mat khau khong khop',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token la bat buoc'),
});

export const resendVerificationSchema = z.object({
  email: z.string().min(1, 'Email la bat buoc').email('Email khong hop le'),
});
