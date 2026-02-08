/**
 * 认证相关 API（star-sso）
 */
import { setToken, clearToken } from './client';
import { getApiConfig } from './config';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  nickname?: string;
}

export interface LoginResponse {
  token: string;
  userNo: string;
  userId: number;
  username: string;
  nickname?: string;
  roles?: string[];
  permissions?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export async function login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  try {
    const base = getApiConfig().ssoBaseURL.replace(/\/$/, '');
    const res = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const result = await res.json();
    const success = result.code === 200 || result.code === 0;
    if (success && result.data?.token) {
      setToken(result.data.token);
    }
    return {
      success,
      data: result.data,
      message: result.message,
      error: !success ? result.message : undefined,
    };
  } catch (e) {
    const msg = (e as Error).message;
    return { success: false, error: msg };
  }
}

export async function register(request: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
  try {
    const base = getApiConfig().ssoBaseURL.replace(/\/$/, '');
    const res = await fetch(`${base}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const result = await res.json();
    const success = result.code === 200 || result.code === 0;
    if (success && result.data?.token) {
      setToken(result.data.token);
    }
    return {
      success,
      data: result.data,
      message: result.message,
      error: !success ? result.message : undefined,
    };
  } catch (e) {
    const msg = (e as Error).message;
    return { success: false, error: msg };
  }
}

export function logout(): void {
  clearToken();
}

export async function getCurrentUser(): Promise<ApiResponse<{ userNo: string; username: string; nickname?: string }>> {
  const token = localStorage.getItem('star_sso_token');
  if (!token) {
    return { success: false, error: '未登录' };
  }
  try {
    const base = getApiConfig().ssoBaseURL.replace(/\/$/, '');
    const res = await fetch(`${base}/user/info`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (res.status === 401) {
      clearToken();
      return { success: false, error: '登录已过期' };
    }
    const success = result.code === 200 || result.code === 0;
    return {
      success,
      data: result.data,
      message: result.message,
      error: !success ? result.message : undefined,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export function hasToken(): boolean {
  return !!localStorage.getItem('star_sso_token');
}
