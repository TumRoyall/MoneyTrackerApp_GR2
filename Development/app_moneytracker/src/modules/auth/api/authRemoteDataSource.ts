import { httpClient } from '@/core/api/httpClient';
import { tokenStorage } from '@/core/storage/tokenStorage';
import { ApiResponse } from '@/core/types/api.types';
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

export class AuthRemoteDataSource {
  async register(payload: RegisterRequestDto): Promise<AuthMessageResponseDto> {
    const response = await httpClient.post<ApiResponse<AuthMessageResponseDto>>(
      '/api/auth/register',
      payload,
    );
    return response.data.data;
  }

  async login(payload: LoginRequestDto): Promise<AuthLoginResponseDto> {
    const response = await httpClient.post<ApiResponse<AuthLoginResponseDto>>(
      '/api/auth/login',
      payload,
    );
    return response.data.data;
  }

  async logout(): Promise<AuthMessageResponseDto> {
    const response = await httpClient.post<ApiResponse<AuthMessageResponseDto>>(
      '/api/auth/logout',
      undefined,
      { headers: await this.getAuthHeaders() },
    );
    return response.data.data;
  }

  async changePassword(payload: ChangePasswordRequestDto): Promise<AuthMessageResponseDto> {
    const response = await httpClient.post<ApiResponse<AuthMessageResponseDto>>(
      '/api/auth/change-password',
      payload,
      { headers: await this.getAuthHeaders() },
    );
    return response.data.data;
  }

  async forgotPassword(payload: ForgotPasswordRequestDto): Promise<AuthMessageResponseDto> {
    const response = await httpClient.post<ApiResponse<AuthMessageResponseDto>>(
      '/api/auth/forgot-password',
      payload,
    );
    return response.data.data;
  }

  async resetPassword(payload: ResetPasswordRequestDto): Promise<AuthMessageResponseDto> {
    const response = await httpClient.post<ApiResponse<AuthMessageResponseDto>>(
      '/api/auth/reset-password',
      payload,
    );
    return response.data.data;
  }

  async verifyEmail(token: string): Promise<AuthMessageResponseDto> {
    const response = await httpClient.get<ApiResponse<AuthMessageResponseDto>>(
      '/api/auth/verify-email',
      { params: { token } },
    );
    return response.data.data;
  }

  async resendVerification(payload: ResendVerificationRequestDto): Promise<AuthMessageResponseDto> {
    const response = await httpClient.post<ApiResponse<AuthMessageResponseDto>>(
      '/api/auth/resend-verification',
      payload,
    );
    return response.data.data;
  }

  async checkEmail(email: string): Promise<CheckEmailResponseDto> {
    const response = await httpClient.get<ApiResponse<CheckEmailResponseDto>>(
      '/api/auth/check-email',
      { params: { email } },
    );
    return response.data.data;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await tokenStorage.getAccessToken();
    if (!token) {
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  }
}
