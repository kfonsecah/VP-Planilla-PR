import { API_CONFIG } from '@/config';

// Build API_BASE defensively: if API_CONFIG.baseUrl already contains /api, keep it; otherwise append /api
const rawBase = API_CONFIG.baseUrl.replace(/\/$/, '');
export const API_BASE = rawBase.toLowerCase().endsWith('/api') ? rawBase : rawBase + '/api';

// Debug log to help identify wrong base URLs during development
if (typeof window !== 'undefined') {
  console.log('[http] API_BASE =', API_BASE);
}

let onAuthFailureCallback: (() => void) | null = null;
let refreshInFlightPromise: Promise<string> | null = null;
let authFailureNotified = false;

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

/**
 * Custom error class for API errors.
 * Extends Error with structured fields so downstream code can distinguish
 * between validation errors (show field-level messages), server errors (show toast),
 * and network errors (show connectivity message).
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly fieldErrors: Record<string, string> | null;
  public readonly isNetworkError: boolean;

  constructor(message: string, statusCode: number, fieldErrors: Record<string, string> | null = null, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Parse an error response body and extract structured error information.
 * Handles multiple backend error formats:
 * - Simple: { message: "..." } or { error: "..." }
 * - Zod validation: { success: false, errors: [{ field: "name", message: "..." }] }
 * - Array errors: { errors: ["error1", "error2"] }
 * - Nested: { error: { message: "...", code: "..." } }
 * - Validation errors: { validationErrors: { field: "message" } }
 * - Details: { details: "..." }
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
async function parseErrorResponse(res: Response): Promise<{ message: string; fieldErrors: Record<string, string> | null; errorCode: string | null }> {
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    try {
      const text = await res.text();
      return { message: text || 'HTTP ' + res.status, fieldErrors: null, errorCode: null };
    } catch {
      return { message: 'HTTP ' + res.status, fieldErrors: null, errorCode: null };
    }
  }

  if (!data || typeof data !== 'object') {
    return { message: 'HTTP ' + res.status, fieldErrors: null, errorCode: null };
  }

  const obj = data as Record<string, unknown>;
  let fieldErrors: Record<string, string> | null = null;
  let message = '';
  let errorCode: string | null = null;

  if (typeof obj.error === 'object' && obj.error !== null) {
    const nestedError = obj.error as Record<string, unknown>;
    if (typeof nestedError.code === 'string') {
      errorCode = nestedError.code;
    }
  }

  if (!errorCode && typeof obj.code === 'string') {
    errorCode = obj.code;
  }

  // Zod validation errors: { success: false, errors: [{ field, message }] }
  if (Array.isArray(obj.errors) && obj.errors.length > 0) {
    const firstError = obj.errors[0];
    if (typeof firstError === 'object' && firstError !== null && 'field' in firstError && 'message' in firstError) {
      // Array of { field, message } objects - build fieldErrors map
      fieldErrors = {};
      const messages: string[] = [];
      for (const err of obj.errors as Array<Record<string, unknown>>) {
        const field = String(err.field || 'unknown');
        const msg = String(err.message || '');
        fieldErrors[field] = msg;
        messages.push(msg);
      }
      message = messages.join('. ');
    } else if (typeof firstError === 'string') {
      // Array of strings: { errors: ["error1", "error2"] }
      message = (obj.errors as string[]).join('. ');
    }
  }

  // Validation errors object: { validationErrors: { field: "message" } }
  if (!message && obj.validationErrors && typeof obj.validationErrors === 'object') {
    fieldErrors = obj.validationErrors as Record<string, string>;
    message = Object.values(fieldErrors).join('. ');
  }

  // Simple message fields
  if (!message) {
    message = String(obj.message || obj.error || obj.details || JSON.stringify(obj));
  }

  // Nested error: { error: { message: "..." } }
  if (!message && typeof obj.error === 'object' && obj.error !== null && 'message' in (obj.error as Record<string, unknown>)) {
    message = String((obj.error as Record<string, unknown>).message);
  }

  return { message: message || 'HTTP ' + res.status, fieldErrors, errorCode };
}

function isAuthCodeRequiringRefresh(errorCode: string | null): boolean {
  if (!errorCode) return true;
  return errorCode === 'AUTH_TOKEN_EXPIRED' || errorCode === 'AUTH_TOKEN_INVALID';
}

function shouldAttemptTokenRefresh(inputPath: string): boolean {
  const normalizedPath = inputPath.startsWith('http')
    ? new URL(inputPath).pathname
    : inputPath;

  return normalizedPath !== '/login'
    && normalizedPath !== '/refresh'
    && normalizedPath !== '/validate';
}

function notifyAuthFailureOnce() {
  clearStoredTokens();
  if (!authFailureNotified) {
    authFailureNotified = true;
    onAuthFailureCallback?.();
    queueMicrotask(() => {
      authFailureNotified = false;
    });
  }
}

async function requestTokenRefresh(): Promise<string> {
  const refresh = getStoredRefreshToken();
  if (!refresh) throw new ApiError('No refresh token available', 401);

  const url = API_BASE + '/refresh';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refresh }),
  });

  if (!response.ok) {
    throw new ApiError('Refresh failed', response.status || 401);
  }

  const payload = await response.json() as { token?: string; refresh_token?: string };
  const newToken = payload?.token;
  if (!newToken) throw new ApiError('Refresh failed', 401);

  const newRefresh = payload.refresh_token ?? refresh;
  setStoredTokens(newToken, newRefresh);
  return newToken;
}

async function tryRefreshToken(): Promise<string> {
  if (!refreshInFlightPromise) {
    refreshInFlightPromise = requestTokenRefresh().finally(() => {
      refreshInFlightPromise = null;
    });
  }

  return refreshInFlightPromise;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
async function rawRequest(inputPath: string, options: RequestInit = {}, retry = true): Promise<Response> {
  const url = inputPath.startsWith('http') ? inputPath : API_BASE + (inputPath.startsWith('/') ? '' : '/') + inputPath;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    'Accept': 'application/json',
  };

  const token = getStoredAccessToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  try {
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 && retry && shouldAttemptTokenRefresh(inputPath)) {
      const { errorCode } = await parseErrorResponse(res.clone());
      if (!isAuthCodeRequiringRefresh(errorCode)) {
        return res;
      }

      // Try refresh once
      try {
        const newToken = await tryRefreshToken();
        // retry original request with new token
        const retryHeaders = { ...(options.headers as Record<string, string> || {}), 'Accept': 'application/json', 'Authorization': 'Bearer ' + newToken };
        const retryRes = await fetch(url, { ...options, headers: retryHeaders });
        if (retryRes.status === 401) {
          notifyAuthFailureOnce();
        }
        return retryRes;
      } catch {
        notifyAuthFailureOnce();
        throw new ApiError('Authentication required', 401);
      }
    }

    return res;
  } catch (error) {
    const isNetworkError = error instanceof TypeError;
    if (isNetworkError) {
      throw new ApiError(
        'No se pudo conectar con la API. Asegurate de que el backend este en ejecucion y que NEXT_PUBLIC_API_URL apunte correctamente al servidor.',
        0,
        null,
        true
      );
    }
    throw error instanceof ApiError ? error : error instanceof Error ? error : new ApiError('Error desconocido al conectar con la API', 0, null, true);
  }
}

async function requestJson(path: string, options: RequestInit = {}) {
  const res = await rawRequest(path, options);
  if (!res.ok) {
    const { message, fieldErrors } = await parseErrorResponse(res);
    throw new ApiError(message || 'HTTP error ' + res.status, res.status, fieldErrors);
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
  } catch {
    return text;
  }
}

export const http = {
  get: (path: string) => requestJson(path, { method: 'GET' }),
  post: (path: string, body?: unknown) => requestJson(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: (path: string, body?: unknown) => requestJson(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: (path: string, body?: unknown) => requestJson(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: (path: string, body?: unknown) => requestJson(path, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  raw: rawRequest,
  setTokens: setStoredTokens,
  clearTokens: clearStoredTokens,
  setOnAuthFailure,
};
