export interface ApiResponse<T> {
  data: T;
  meta?: unknown | null;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
  timestamp?: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}
