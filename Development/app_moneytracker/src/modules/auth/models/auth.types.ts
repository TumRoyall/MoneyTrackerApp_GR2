export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  fullname: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
}

export interface ResendVerificationRequestDto {
  email: string;
}

export interface AuthMessageResponseDto {
  message: string;
}

export interface AuthUserDto {
  userId: string;
  email: string;
  fullName: string;
}

export interface AuthLoginResponseDto {
  token: string;
  user: AuthUserDto;
}

export interface AuthSession {
  token: string;
  user: AuthUserDto;
}

export interface CheckEmailResponseDto {
  exists: boolean;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailFormValues {
  token: string;
}

export interface ResendVerificationFormValues {
  email: string;
}
