import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

/**
 * Lưu JWT sau khi login
 */
export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

/**
 * Lấy JWT cho axios interceptor
 */
export const getToken = async () => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

/**
 * Logout / token hết hạn
 */
export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
