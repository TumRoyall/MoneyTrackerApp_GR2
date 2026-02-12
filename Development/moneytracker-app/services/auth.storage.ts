import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_profile";
const CREDENTIALS_KEY = "cached_credentials"; // For offline login

/**
 * Lưu JWT sau khi login - MUST be string
 */
export const saveToken = async (token: string | null | undefined) => {
  if (!token || typeof token !== "string") {
    console.warn("[Auth Storage] Invalid token:", typeof token);
    return;
  }
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    console.log("[Auth Storage] Token saved successfully");
  } catch (error) {
    console.error("[Auth Storage] Failed to save token:", error);
    throw error;
  }
};

/**
 * Lấy JWT cho axios interceptor
 */
export const getToken = async () => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

/**
 * Lưu refresh token - MUST be string
 */
export const saveRefreshToken = async (token: string | null | undefined) => {
  if (!token || typeof token !== "string") {
    console.log("[Auth Storage] No refresh token to save");
    return;
  }
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    console.log("[Auth Storage] Refresh token saved successfully");
  } catch (error) {
    console.error("[Auth Storage] Failed to save refresh token:", error);
    throw error;
  }
};

/**
 * Lấy refresh token
 */
export const getRefreshToken = async () => {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

/**
 * Lưu user profile - MUST stringify before saving
 */
export const saveUserProfile = async (profile: any) => {
  // Ensure profile is valid object, extract only needed fields
  if (!profile || typeof profile !== "object") {
    throw new Error("Invalid profile object");
  }

  const cleanProfile = {
    user_id: profile.user_id || "",
    email: profile.email || "",
    full_name: profile.full_name || "",
  };

  // Must stringify before storing
  const profileString = JSON.stringify(cleanProfile);
  console.log("[Auth Storage] Saving user profile:", profileString);

  await SecureStore.setItemAsync(USER_KEY, profileString);
};

/**
 * Lấy user profile
 */
export const getUserProfile = async () => {
  const profile = await SecureStore.getItemAsync(USER_KEY);
  return profile ? JSON.parse(profile) : null;
};

/**
 * Lưu credentials cho offline login (email + hashed password)
 * CHỈ lưu khi user check "Remember me"
 */
export const saveCachedCredentials = async (
  email: string,
  hashedPassword: string,
) => {
  const credentials = { email, hashedPassword, savedAt: Date.now() };
  await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
};

/**
 * Lấy cached credentials
 */
export const getCachedCredentials = async () => {
  const creds = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  return creds ? JSON.parse(creds) : null;
};

/**
 * Xóa cached credentials
 */
export const removeCachedCredentials = async () => {
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
};

/**
 * Logout / token hết hạn
 */
export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

/**
 * Clear all auth data
 */
export const clearAllAuthData = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
};
