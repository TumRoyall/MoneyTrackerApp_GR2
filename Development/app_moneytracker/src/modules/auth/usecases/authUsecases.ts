import {
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResendVerificationRequestDto,
  ResetPasswordRequestDto,
  UpdateUserRequestDto,
} from '@/modules/auth/models/auth.types';
import { AuthRepository } from '@/modules/auth/repository/authRepository';

export const createAuthUsecases = (repository: AuthRepository) => ({
  register: (payload: RegisterRequestDto) => repository.register(payload),
  login: (payload: LoginRequestDto) => repository.login(payload),
  logout: () => repository.logout(),
  updateProfile: (payload: UpdateUserRequestDto) => repository.updateProfile(payload),
  changePassword: (payload: ChangePasswordRequestDto) => repository.changePassword(payload),
  forgotPassword: (payload: ForgotPasswordRequestDto) => repository.forgotPassword(payload),
  resetPassword: (payload: ResetPasswordRequestDto) => repository.resetPassword(payload),
  verifyEmail: (token: string) => repository.verifyEmail(token),
  resendVerification: (payload: ResendVerificationRequestDto) => repository.resendVerification(payload),
  checkEmail: (email: string) => repository.checkEmail(email),
});
