import { executeSQL, fetchOne } from "@/db/init";

/* ===================== TYPES ===================== */

export interface UserProfile {
  user_id: string;
  email: string;
  full_name?: string;
  is_admin: number;
  is_verified: number;
  access_token?: string;
  refresh_token?: string;
  token_exp_at?: number;
  version: number;
  created_at: number;
  updated_at: number;
  deleted_at?: number;
}

export interface CreateUserProfilePayload {
  user_id: string;
  email: string;
  full_name?: string;
  access_token?: string;
  refresh_token?: string;
  token_exp_at?: number;
}

/* ===================== DAO ===================== */

/**
 * Get user profile
 */
export const getUserProfile = async (
  userId: string,
): Promise<UserProfile | null> => {
  return fetchOne<UserProfile>(
    `SELECT * FROM user_profiles WHERE user_id = ?`,
    [userId],
  );
};

/**
 * Create or update user profile
 */
export const saveUserProfile = async (
  payload: CreateUserProfilePayload,
): Promise<UserProfile> => {
  const now = Date.now();

  // Check if exists
  const existing = await getUserProfile(payload.user_id);

  if (existing) {
    // Update
    await executeSQL(
      `UPDATE user_profiles SET 
        email = ?, 
        full_name = ?, 
        access_token = ?, 
        refresh_token = ?, 
        token_exp_at = ?,
        updated_at = ?
      WHERE user_id = ?`,
      [
        payload.email,
        payload.full_name || null,
        payload.access_token || null,
        payload.refresh_token || null,
        payload.token_exp_at || null,
        now,
        payload.user_id,
      ],
    );
  } else {
    // Insert
    await executeSQL(
      `INSERT INTO user_profiles (
        user_id, email, full_name, access_token, refresh_token, token_exp_at, 
        is_admin, is_verified, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.user_id,
        payload.email,
        payload.full_name || null,
        payload.access_token || null,
        payload.refresh_token || null,
        payload.token_exp_at || null,
        0,
        0,
        1,
        now,
        now,
      ],
    );
  }

  const profile = await getUserProfile(payload.user_id);
  if (!profile) throw new Error("Failed to save user profile");
  return profile;
};

/**
 * Update user tokens
 */
export const updateUserTokens = async (
  userId: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: number,
): Promise<void> => {
  const now = Date.now();
  await executeSQL(
    `UPDATE user_profiles SET 
      access_token = ?, 
      refresh_token = ?, 
      token_exp_at = ?,
      updated_at = ?
    WHERE user_id = ?`,
    [accessToken, refreshToken || null, expiresAt || null, now, userId],
  );
};

/**
 * Delete user profile (logout)
 */
export const deleteUserProfile = async (userId: string): Promise<void> => {
  await executeSQL(`DELETE FROM user_profiles WHERE user_id = ?`, [userId]);
};

/**
 * Get current user (should only be one)
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  return fetchOne<UserProfile>(`SELECT * FROM user_profiles LIMIT 1`, []);
};
