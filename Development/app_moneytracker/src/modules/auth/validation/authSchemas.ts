import { z } from 'zod';

const passwordSchema = z.string().min(1, 'Mật khẩu là bắt buộc');

export const loginSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    fullName: z.string().min(1, 'Họ và tên là bắt buộc'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token là bắt buộc'),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token là bắt buộc'),
});

export const resendVerificationSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
});
