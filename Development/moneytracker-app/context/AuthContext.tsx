/**
 * Auth Context - Simple, Direct API calls
 *
 * Just login → save token → done
 */

import * as authApi from "@/services/auth.api";
import * as authStorage from "@/services/auth.storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface AuthContextType {
  isLoggedIn: boolean;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if already logged in on app start
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await authStorage.getToken();
        if (token) {
          const profile = await authStorage.getUserProfile();
          if (profile) {
            setUserId(profile.user_id);
            setEmail(profile.email);
            setFullName(profile.full_name || null);
            setIsLoggedIn(true);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.loginApi({
        email,
        password,
      });

      setUserId(String(response.userId));
      setEmail(response.email);
      setFullName(response.fullname || null);
      setIsLoggedIn(true);
    } catch (err: any) {
      const errorMsg = err.message || "Login failed";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.registerApi({
        email,
        password,
        fullname: fullName,
      });

      setUserId(response.userId);
      setEmail(response.email);
      setFullName(response.fullname || null);
      setIsLoggedIn(true);
    } catch (err: any) {
      const errorMsg = err.message || "Registration failed";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      try {
        await authApi.logoutApi();
      } catch (err) {
        await authStorage.clearAllAuthData();
      }

      setUserId(null);
      setEmail(null);
      setFullName(null);
      setIsLoggedIn(false);
      setError(null);
    } catch (err) {
      console.error("Logout error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    isLoggedIn,
    userId,
    email,
    fullName,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
