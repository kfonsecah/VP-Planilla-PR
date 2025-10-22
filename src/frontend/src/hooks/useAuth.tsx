"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/authService';
import { http } from '@/services/http';
import { useUser } from '@/hooks/user';

interface AuthContextValue {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void> | void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize from stored tokens/user
    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const access = typeof window !== 'undefined' ? localStorage.getItem('vp_access_token') : null;
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('vp_refresh_token') : null;

      if (access) {
        http.setTokens(access, refresh);
      }

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        } catch (_e) {
          // ignore
        }
      }

      // register global auth-failure handler
      http.setOnAuthFailure(() => {
        // clear local state and redirect to auth
        http.clearTokens();
        setUser(null as any);
        localStorage.removeItem('user');
        router.push('/auth');
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const resp = await AuthService.login(username, password);
      const token = (resp as any)?.token;
      const refresh = (resp as any)?.refresh_token || null;
      const userData = (resp as any)?.user || null;
      if (!token) throw new Error('No token received');

      http.setTokens(token, refresh);
      if (userData) {
        try {
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (_e) {}
        setUser(userData);
      }

      // ensure onAuthFailure is set
      http.setOnAuthFailure(() => {
        http.clearTokens();
        setUser(null as any);
        localStorage.removeItem('user');
        router.push('/auth');
      });

    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('vp_access_token') : null;
      if (token) {
        try {
          await AuthService.logout(token);
        } catch (_e) {
          // ignore logout errors
        }
      }
    } finally {
      http.clearTokens();
      setUser(null as any);
      localStorage.removeItem('user');
      router.push('/auth');
    }
  };

  const value: AuthContextValue = {
    user: user || null,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
