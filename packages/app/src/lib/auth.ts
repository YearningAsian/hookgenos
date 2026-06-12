'use client';
import { api, type User } from './api';

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return await api.auth.me();
  } catch {
    return null;
  }
}

/**
 * Sanitize a post-auth redirect target taken from the URL.
 * Only same-origin paths are allowed — anything absolute ("https://…"),
 * protocol-relative ("//…"), or backslash-escaped is rejected to prevent
 * open redirects after login/registration.
 */
export function safeNextPath(raw: string | null, fallback = '/dashboard'): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  return raw;
}
