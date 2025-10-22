import { API_CONFIG } from '@/config';
import { AuthService } from './authService';

// Build API_BASE defensively: if API_CONFIG.baseUrl already contains /api, keep it; otherwise append /api
const rawBase = API_CONFIG.baseUrl.replace(/\/$/, '');
export const API_BASE = rawBase.toLowerCase().endsWith('/api') ? rawBase : `${rawBase}/api`;

// Debug log to help identify wrong base URLs during development
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[http] API_BASE =', API_BASE);
}

let onAuthFailureCallback: (() => void) | null = null;

const STORAGE_KEYS = {
  ACCESS: 'vp_access_token',
  REFRESH: 'vp_refresh_token',
};

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS);
}

function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH);
}

export function setStoredTokens(accessToken: string | null, refreshToken: string | null) {
  if (typeof window === 'undefined') return;
  if (accessToken) localStorage.setItem(STORAGE_KEYS.ACCESS, accessToken);
  else localStorage.removeItem(STORAGE_KEYS.ACCESS);

  if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH, refreshToken);
  else localStorage.removeItem(STORAGE_KEYS.REFRESH);
}

export function clearStoredTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ACCESS);
  localStorage.removeItem(STORAGE_KEYS.REFRESH);
}

export function setOnAuthFailure(cb: () => void) {
  onAuthFailureCallback = cb;
}

async function tryRefreshToken(): Promise<string> {
  const refresh = getStoredRefreshToken();
  if (!refresh) throw new Error('No refresh token available');

  // Use AuthService.refreshToken to call /api/refresh
  const resp = await AuthService.refreshToken(refresh);
  // Expecting { token: string } (backend may return more)
  const newToken = (resp as any)?.token;
  if (!newToken) throw new Error('Refresh failed');

  // Optionally update refresh token if backend returned one
  const newRefresh = (resp as any)?.refresh_token || refresh;
  setStoredTokens(newToken, newRefresh);
  return newToken;
}

async function parseErrorResponse(res: Response) {
  try {
    const data = await res.json();
    const msg = data?.message || data?.error || JSON.stringify(data);
    return msg;
  } catch (_e) {
    try {
      const text = await res.text();
      return text;
    } catch (_e2) {
      return `HTTP ${res.status}`;
    }
  }
}

async function rawRequest(inputPath: string, options: RequestInit = {}, retry = true): Promise<Response> {
  const url = inputPath.startsWith('http') ? inputPath : `${API_BASE}${inputPath.startsWith('/') ? '' : '/'}${inputPath}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    'Accept': 'application/json',
  };

  const token = getStoredAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && retry) {
    // Try refresh once
    try {
      const newToken = await tryRefreshToken();
      // retry original request with new token
      const retryHeaders = { ...(options.headers as Record<string, string> || {}), 'Accept': 'application/json', 'Authorization': `Bearer ${newToken}` };
      const retryRes = await fetch(url, { ...options, headers: retryHeaders });
      if (retryRes.status === 401) {
        // Force logout
        clearStoredTokens();
        if (onAuthFailureCallback) onAuthFailureCallback();
      }
      return retryRes;
    } catch (err) {
      // Refresh failed -> logout
      clearStoredTokens();
      if (onAuthFailureCallback) onAuthFailureCallback();
      throw new Error('Authentication required');
    }
  }

  return res;
}

async function requestJson(path: string, options: RequestInit = {}) {
  const res = await rawRequest(path, options);
  if (!res.ok) {
    const errMsg = await parseErrorResponse(res);
    throw new Error(errMsg || `HTTP error ${res.status}`);
  }

  // Try to parse JSON; if empty body return null
  const text = await res.text();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    // If backend uses wrapper { success: true, data: ... }, return data directly
    if (parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, 'data')) {
      return parsed.data;
    }
    return parsed;
  } catch (e) {
    return text;
  }
}

export const http = {
  get: (path: string) => requestJson(path, { method: 'GET' }),
  post: (path: string, body?: any) => requestJson(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: (path: string, body?: any) => requestJson(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: (path: string, body?: any) => requestJson(path, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  raw: rawRequest,
  setTokens: setStoredTokens,
  clearTokens: clearStoredTokens,
  setOnAuthFailure,
};
