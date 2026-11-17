import type { SessionPayload, SignInInput, SignUpInput, User } from '../types/auth';

const SESSION_STORAGE_KEY = 'back-office-session';
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function readSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export function writeSessionId(sessionId: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (sessionId) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const sessionId = readSessionId();

  if (sessionId) {
    headers.set('Authorization', `Bearer ${sessionId}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Request failed');
  }

  return payload as T;
}

export const authApi = {
  signUp: (payload: SignUpInput) =>
    apiFetch<SessionPayload>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  signIn: (payload: SignInInput) =>
    apiFetch<SessionPayload>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCurrentUser: () => apiFetch<User>('/api/auth/me'),
  logout: () =>
    apiFetch<{ success: boolean; sessionId: string }>('/api/auth/logout', {
      method: 'POST',
    }),
};
