'use client';
import { api, type User } from './api';

export function saveToken(token: string) {
  localStorage.setItem('hg_token', token);
}
export function clearToken() {
  localStorage.removeItem('hg_token');
}
export function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('hg_token') : null;
}
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return await api.auth.me();
  } catch {
    clearToken();
    return null;
  }
}
