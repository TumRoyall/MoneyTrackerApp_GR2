import {
  AuthLoginResponseDto,
  AuthMessageResponseDto,
  ChangePasswordRequestDto,
  CheckEmailResponseDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResendVerificationRequestDto,
  ResetPasswordRequestDto,
} from '@/modules/auth/models/auth.types';

export interface AuthRepository {
  register(payload: RegisterRequestDto): Promise<AuthMessageResponseDto>;
  login(payload: LoginRequestDto): Promise<AuthLoginResponseDto>;
  logout(): Promise<AuthMessageResponseDto>;
  changePassword(payload: ChangePasswordRequestDto): Promise<AuthMessageResponseDto>;
  forgotPassword(payload: ForgotPasswordRequestDto): Promise<AuthMessageResponseDto>;
  resetPassword(payload: ResetPasswordRequestDto): Promise<AuthMessageResponseDto>;
  verifyEmail(token: string): Promise<AuthMessageResponseDto>;
  resendVerification(payload: ResendVerificationRequestDto): Promise<AuthMessageResponseDto>;
  checkEmail(email: string): Promise<CheckEmailResponseDto>;
}
