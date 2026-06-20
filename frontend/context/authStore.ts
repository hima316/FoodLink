'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthTokens } from '../types';
import authService from '../lib/auth';
import { clearAuthCookies } from '../lib/api';

// ==========================================
// Auth Store Interface
// ==========================================
interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: 'hotel' | 'ngo' | 'volunteer';
    organizationName?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

// ==========================================
// Create Zustand Store with Persistence
// ==========================================
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      setTokens: (tokens) =>
        set({ tokens }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      clearError: () =>
        set({ error: null }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.login({ email, password });
          set({
            user: result.user,
            tokens: result.tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const message =
            (error as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ||
            'Login failed. Please check your credentials.';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.register(data);
          set({
            user: result.user,
            tokens: result.tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const message =
            (error as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ||
            'Registration failed. Please try again.';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch {
          // Ignore logout errors
        } finally {
          clearAuthCookies();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      fetchCurrentUser: async () => {
        const { isAuthenticated } = get();
        if (!isAuthenticated) return;

        set({ isLoading: true });
        try {
          const user = await authService.getMe();
          set({ user, isLoading: false });
        } catch {
          // Token might be expired - clear auth
          clearAuthCookies();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'foodlink-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      // Only persist user and auth status, not loading/error states
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
