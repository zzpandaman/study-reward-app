/**
 * 认证相关 API（star-sso）
 * 路径与网关约定一致：GET /api/sso/user/info（相对站点的根路径，与 VITE_SSO_BASE_URL 拼接）
 */
import { setToken, clearToken } from './client';
import { getApiConfig } from './config';

/** 拼接 SSO 请求 URL：支持 base 为 `/api/sso` 或 `http://host:port/api/sso` */
function joinSsoUrl(pathSegment: string): string {
  const base = getApiConfig().ssoBaseURL.trim().replace(/\/+$/, '');
  const path = pathSegment.replace(/^\/+/, '');
  if (/^https?:\/\//i.test(base)) {
    return `${base}/${path}`;
  }
  const root = base.startsWith('/') ? base : `/${base}`;
  return `${root}/${path}`;
}

/** 归一化 user/info 响应字段，兼容不同版本 SSO */
function normalizeUserInfoPayload(raw: unknown): CurrentUserProfile | null {
  if (raw == null || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  const userNoRaw = d.userNo ?? d.user_no ?? d.sub;
  const usernameRaw = d.username ?? d.userName ?? d.user_name;
  const userIdRaw = d.userId ?? d.user_id;
  const userId = typeof userIdRaw === 'number' ? userIdRaw : Number(userIdRaw) || undefined;
  const username =
    typeof usernameRaw === 'string' && usernameRaw.trim()
      ? usernameRaw.trim()
      : typeof userNoRaw === 'string' && userNoRaw.trim()
        ? userNoRaw.trim()
        : userId != null && !Number.isNaN(userId)
          ? String(userId)
          : '';
  const userNo =
    typeof userNoRaw === 'string' && userNoRaw.trim()
      ? userNoRaw.trim()
      : username || (userId != null ? `uid:${userId}` : '');
  if (!userNo && !username) return null;
  const nickname = typeof d.nickname === 'string' ? d.nickname : undefined;
  return {
    userNo: userNo || username,
    username: username || userNo,
    nickname,
    userId,
  };
}

export interface CurrentUserProfile {
  userNo: string;
  username: string;
  nickname?: string;
  userId?: number;
}

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
    const res = await fetch(joinSsoUrl('login'), {
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
    const res = await fetch(joinSsoUrl('register'), {
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

export async function getCurrentUser(): Promise<ApiResponse<CurrentUserProfile>> {
  const token = localStorage.getItem('star_sso_token');
  if (!token) {
    return { success: false, error: '未登录' };
  }
  try {
    const res = await fetch(joinSsoUrl('user/info'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const result = await res.json();
    if (res.status === 401) {
      clearToken();
      return { success: false, error: '登录已过期' };
    }
    let rawPayload: unknown = result?.data;
    if (rawPayload == null && res.ok && result && typeof result === 'object') {
      const r = result as Record<string, unknown>;
      if (r.username != null || r.userNo != null || r.user_no != null || r.userId != null || r.sub != null) {
        rawPayload = r;
      }
    }
    const normalized = normalizeUserInfoPayload(rawPayload);
    const codeOk = result.code === undefined || result.code === 200 || result.code === 0;
    const success = res.ok && codeOk && !!normalized;
    return {
      success,
      data: normalized ?? undefined,
      message: result.message,
      error: !success ? (result.message ?? (!normalized ? '用户信息格式异常' : undefined)) : undefined,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export function hasToken(): boolean {
  return !!localStorage.getItem('star_sso_token');
}
