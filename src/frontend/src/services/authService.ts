import { API_CONFIG } from '@/config';

const BASE = `${API_CONFIG.baseUrl.replace(/\/$/, '')}/api`;

export interface LoginResponse {
  token?: string;
  refresh_token?: string;
  user?: any;
}

export const AuthService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Credenciales inválidas');
    }
    return res.json();
  },

  async me(token: string): Promise<any> {
    const res = await fetch(`${BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al obtener información del usuario');
    return res.json();
  },

  async logout(token: string): Promise<void> {
    const res = await fetch(`${BASE}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al cerrar sesión');
  },

  async validateToken(token: string): Promise<boolean> {
    const res = await fetch(`${BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return false;
    return true;
  },

  async refreshToken(refreshToken: string): Promise<{ token: string }>{
    const res = await fetch(`${BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'No se pudo refrescar token');
    }
    return res.json();
  },

  async changePassword(token: string, current_password: string, new_password: string): Promise<void> {
    const res = await fetch(`${BASE}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ current_password, new_password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Error al cambiar contraseña');
    }
  },
};
