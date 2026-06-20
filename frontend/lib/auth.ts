import api, { setAuthCookies, clearAuthCookies } from './api';
import {
  LoginCredentials,
  RegisterData,
  User,
  AuthTokens,
  ApiResponse,
} from '../types';

// ==========================================
// Auth API Service
// ==========================================

export const authService = {
  /**
   * Register a new user
   */
  register: async (
    data: RegisterData
  ): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await api.post<
      ApiResponse<{ user: User; tokens: AuthTokens }>
    >('/auth/register', data);
    const result = response.data.data!;
    setAuthCookies(result.tokens.accessToken, result.tokens.refreshToken);
    return result;
  },

  /**
   * Login with email and password
   */
  login: async (
    credentials: LoginCredentials
  ): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await api.post<
      ApiResponse<{ user: User; tokens: AuthTokens }>
    >('/auth/login', credentials);
    const result = response.data.data!;
    setAuthCookies(result.tokens.accessToken, result.tokens.refreshToken);
    return result;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      clearAuthCookies();
    }
  },

  /**
   * Get current authenticated user
   */
  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data!.user;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (
    refreshToken: string
  ): Promise<AuthTokens> => {
    const response = await api.post<
      ApiResponse<{ tokens: AuthTokens }>
    >('/auth/refresh', { refreshToken });
    const tokens = response.data.data!.tokens;
    setAuthCookies(tokens.accessToken, tokens.refreshToken);
    return tokens;
  },
};

export default authService;
