import { ApiError, http } from './http';

interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  role: string;
}

export interface LoginResponse {
  token?: string;
  refresh_token?: string;
  user?: AuthUser;
}

export const AuthService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    return http.post('/login', { username, password }) as Promise<LoginResponse>;
  },

  async me(token: string): Promise<AuthUser> {
    void token;
    return http.get('/me') as Promise<AuthUser>;
  },

  async logout(token: string): Promise<void> {
    void token;
    await http.post('/logout');
  },

  async validateToken(token: string): Promise<boolean> {
    try {
      await http.post('/validate', { token });
      return true;
    } catch {
      return false;
    }
  },

  async refreshToken(refreshToken: string): Promise<{ token: string; refresh_token?: string }>{
    return http.post('/refresh', { refresh_token: refreshToken }) as Promise<{ token: string; refresh_token?: string }>;
  },

  async changePassword(_token: string, current_password: string, new_password: string): Promise<void> {
    try {
      await http.post('/change-password', { current_password, new_password });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Error al cambiar contraseña');
      }
      throw error;
    }
  },

  async requestPasswordChange(email: string): Promise<{ success: boolean; message: string }> {
    return http.post('/password-request', { email }) as Promise<{ success: boolean; message: string }>;
  },

  async confirmPasswordChange(
    code: string,
    new_password: string,
    confirm_password: string
  ): Promise<{ success: boolean; message: string }> {
    return http.post('/password-confirm', { 
      code, 
      new_password, 
      confirm_password 
    }) as Promise<{ success: boolean; message: string }>;
  },
};
