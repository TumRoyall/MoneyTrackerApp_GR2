import NetInfo from "@react-native-community/netinfo";
import * as authStorage from "./auth.storage";
import api from "./axios";

/**
 * Auth API - Backend + Offline Support
 *
 * FLOW:
 * 1. Lần đầu tiên: PHẢI online, gọi backend để verify credentials
 * 2. Lần sau: Có thể offline, dùng cached credentials
 * 3. Khi online: Sync với backend
 */

/**
 * Auth API Response từ backend
 * Backend trả về: token, userId, email, fullname
 */
export interface LoginResponse {
  token: string; // JWT token
  userId: number | string;
  email: string;
  fullname?: string;
  refresh_token?: string;
  token_expires_in?: number;
}

export interface RegisterResponse {
  token: string;
  userId: number | string;
  email: string;
  fullname?: string;
  refresh_token?: string;
}

export interface AuthError {
  type: "OFFLINE" | "INVALID_CREDENTIALS" | "SERVER_ERROR" | "NETWORK_ERROR";
  message: string;
}

/**
 * Simple password hasher (client-side, for offline verification only)
 * NOT FOR SECURITY - just for offline cache validation
 */
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Login - Online First, Fallback to Offline
 */
export const loginApi = async (data: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<LoginResponse> => {
  try {
    // 1. Check network status
    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected === true;

    if (isOnline) {
      // Online: Call backend
      console.log("[Auth] Online - calling backend");
      const response = await api.post<LoginResponse>("/api/auth/login", {
        email: data.email,
        password: data.password,
      });

      if (response.data) {
        console.log("[Auth] Backend login response:", response.data);

        // Map backend response to standard format
        const { token, userId, email, fullname } = response.data;

        // Save token - MUST be string
        if (token && typeof token === "string") {
          await authStorage.saveToken(token);
          console.log("[Auth] Token saved");
        } else {
          console.error("[Auth] Invalid token type:", typeof token);
          throw new Error("Invalid token from backend");
        }

        if (
          response.data.refresh_token &&
          typeof response.data.refresh_token === "string"
        ) {
          await authStorage.saveRefreshToken(response.data.refresh_token);
          console.log("[Auth] Refresh token saved");
        }

        // Save user profile - extract only needed fields
        const userProfile = {
          user_id: String(userId), // Convert to string
          email: email,
          full_name: fullname || "",
        };

        try {
          await authStorage.saveUserProfile(userProfile);
          console.log("[Auth] User profile saved:", userProfile);
        } catch (profileError) {
          console.error("[Auth] Error saving profile:", profileError);
          // Don't fail login just because profile save failed
        }

        // Save cached credentials if "Remember me" checked
        if (data.rememberMe) {
          try {
            await authStorage.saveCachedCredentials(
              data.email,
              simpleHash(data.password),
            );
            console.log("[Auth] Credentials cached for offline login");
          } catch (cacheError) {
            console.error("[Auth] Error caching credentials:", cacheError);
            // Don't fail login if caching fails
          }
        }

        // Return standardized response
        return {
          token: token,
          userId: String(userId),
          email: email,
          fullname: fullname,
        };
      }
    } else {
      // Offline: Try cached credentials
      console.log("[Auth] Offline - trying cached credentials");
      const cached = await authStorage.getCachedCredentials();

      if (!cached) {
        throw {
          type: "OFFLINE",
          message:
            "No internet connection. Please login online first or check 'Remember me' for offline access.",
        } as AuthError;
      }

      // Verify cached credentials
      const hashedPassword = simpleHash(data.password);
      if (
        cached.email !== data.email ||
        cached.hashedPassword !== hashedPassword
      ) {
        throw {
          type: "INVALID_CREDENTIALS",
          message: "Invalid email or password (offline mode)",
        } as AuthError;
      }

      // Get cached user profile
      const userProfile = await authStorage.getUserProfile();
      if (!userProfile) {
        throw {
          type: "OFFLINE",
          message: "User profile not found in offline cache",
        } as AuthError;
      }

      console.log("[Auth] Offline login successful with cached credentials");

      return {
        userId: userProfile.user_id,
        email: userProfile.email,
        fullname: userProfile.full_name,
        token: "offline_token_cached", // Dummy token for offline mode
      };
    }

    throw new Error("Login failed");
  } catch (error: any) {
    console.error("[Auth] Login error:", error);

    // If it's our custom error, rethrow it
    if (error.type) {
      throw error;
    }

    // Network error
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      // Offline - try cached
      const cached = await authStorage.getCachedCredentials();
      if (!cached) {
        throw {
          type: "OFFLINE",
          message: "No internet. Please login online first.",
        } as AuthError;
      }
      // Will be handled in the offline check above
    }

    throw {
      type: "SERVER_ERROR",
      message: error.response?.data?.message || error.message || "Login failed",
    } as AuthError;
  }
};

/**
 * Register - Backend Only (MUST BE ONLINE)
 */
export const registerApi = async (data: {
  email: string;
  password: string;
  fullname: string;
}): Promise<any> => {
  try {
    // Check if online
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw {
        type: "OFFLINE",
        message: "Registration requires internet connection",
      } as AuthError;
    }

    const response = await api.post<RegisterResponse>(
      "/api/auth/register",
      data,
    );

    if (response.data) {
      console.log("[Auth] Register response:", response.data);

      const { token, userId, email, fullname } = response.data;

      // Save tokens
      if (token && typeof token === "string") {
        await authStorage.saveToken(token);
      }
      if (
        response.data.refresh_token &&
        typeof response.data.refresh_token === "string"
      ) {
        await authStorage.saveRefreshToken(response.data.refresh_token);
      }

      // Save user profile
      const userProfile = {
        user_id: String(userId),
        email: email,
        full_name: fullname || "",
      };

      try {
        await authStorage.saveUserProfile(userProfile);
      } catch (profileError) {
        console.error("[Auth] Error saving profile:", profileError);
      }

      // Return standardized response
      return {
        token: token,
        userId: String(userId),
        email: email,
        fullname: fullname,
      };
    }

    throw new Error("Registration failed");
  } catch (error: any) {
    console.error("[Auth] Register error:", error);

    if (error.type) {
      throw error;
    }

    throw {
      type: "SERVER_ERROR",
      message:
        error.response?.data?.message || error.message || "Registration failed",
    } as AuthError;
  }
};

/**
 * Check email - Backend Only
 */
export const checkEmailApi = async (
  email: string,
): Promise<{ exists: boolean }> => {
  try {
    const response = await api.get<{ exists: boolean }>(
      "/api/auth/check-email",
      {
        params: { email },
      },
    );
    return response.data;
  } catch (error) {
    console.error("[Auth] Check email error:", error);
    throw error;
  }
};

/**
 * Logout - Clear all cached data
 */
export const logoutApi = async (): Promise<void> => {
  try {
    await authStorage.clearAllAuthData();
    console.log("[Auth] Logout successful");
  } catch (error) {
    console.error("[Auth] Logout error:", error);
    throw error;
  }
};
