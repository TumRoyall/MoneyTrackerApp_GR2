import { tokenStorage } from '@/core/storage/tokenStorage';
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
import { AuthRemoteDataSource } from '@/modules/auth/api/authRemoteDataSource';
import { AuthRepository } from '@/modules/auth/repository/authRepository';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly remote: AuthRemoteDataSource) {}

  async register(payload: RegisterRequestDto): Promise<AuthMessageResponseDto> {
    return this.remote.register(payload);
  }

  async login(payload: LoginRequestDto): Promise<AuthLoginResponseDto> {
    const result = await this.remote.login(payload);
    await tokenStorage.setAccessToken(result.token);
    return result;
  }

  async logout(): Promise<AuthMessageResponseDto> {
    const result = await this.remote.logout();
    await tokenStorage.clear();
    return result;
  }

  async changePassword(payload: ChangePasswordRequestDto): Promise<AuthMessageResponseDto> {
    return this.remote.changePassword(payload);
  }

  async forgotPassword(payload: ForgotPasswordRequestDto): Promise<AuthMessageResponseDto> {
    return this.remote.forgotPassword(payload);
  }

  async resetPassword(payload: ResetPasswordRequestDto): Promise<AuthMessageResponseDto> {
    return this.remote.resetPassword(payload);
  }

  async verifyEmail(token: string): Promise<AuthMessageResponseDto> {
    return this.remote.verifyEmail(token);
  }

  async resendVerification(payload: ResendVerificationRequestDto): Promise<AuthMessageResponseDto> {
    return this.remote.resendVerification(payload);
  }

  async checkEmail(email: string): Promise<CheckEmailResponseDto> {
    return this.remote.checkEmail(email);
  }
}
