/**
 * User Profile Service - Local Database
 * Manages user profile stored locally
 */

import * as UserProfileDAO from "@/dao/UserProfileDAO";

export type UserProfile = UserProfileDAO.UserProfile;
export type CreateUserProfilePayload = UserProfileDAO.CreateUserProfilePayload;

/* ===================== SERVICE FUNCTIONS ===================== */

/**
 * Get current user profile
 */
export const getUserProfile = async (
  userId: string,
): Promise<UserProfile | null> => {
  try {
    console.log("[UserProfileService] Fetching user profile:", userId);
    const profile = await UserProfileDAO.getUserProfile(userId);
    return profile;
  } catch (error) {
    console.error("[UserProfileService] Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Save user profile (login)
 */
export const saveUserProfile = async (
  payload: CreateUserProfilePayload,
): Promise<UserProfile> => {
  try {
    console.log("[UserProfileService] Saving user profile:", payload.user_id);
    const profile = await UserProfileDAO.saveUserProfile(payload);
    console.log("[UserProfileService] User profile saved");
    return profile;
  } catch (error) {
    console.error("[UserProfileService] Error saving user profile:", error);
    throw error;
  }
};

/**
 * Update user tokens (after token refresh)
 */
export const updateUserTokens = async (
  userId: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: number,
): Promise<void> => {
  try {
    console.log("[UserProfileService] Updating tokens for user:", userId);
    await UserProfileDAO.updateUserTokens(
      userId,
      accessToken,
      refreshToken,
      expiresAt,
    );
    console.log("[UserProfileService] User tokens updated");
  } catch (error) {
    console.error("[UserProfileService] Error updating user tokens:", error);
    throw error;
  }
};

/**
 * Delete user profile (logout)
 */
export const deleteUserProfile = async (userId: string): Promise<void> => {
  try {
    console.log("[UserProfileService] Deleting user profile:", userId);
    await UserProfileDAO.deleteUserProfile(userId);
    console.log("[UserProfileService] User profile deleted");
  } catch (error) {
    console.error("[UserProfileService] Error deleting user profile:", error);
    throw error;
  }
};

/**
 * Get current user (should only be one)
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    const user = await UserProfileDAO.getCurrentUser();
    return user;
  } catch (error) {
    console.error("[UserProfileService] Error getting current user:", error);
    throw error;
  }
};
