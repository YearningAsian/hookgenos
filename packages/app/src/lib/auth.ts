'use client';
import { api, type User } from './api';

// Re-exported so the public API (`import { safeNextPath } from '@/lib/auth'`)
// stays stable; the implementation lives in a pure module so it can be unit
// tested without pulling in this client module's runtime chain.
export { safeNextPath } from './safe-next-path';

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return await api.auth.me();
  } catch {
    return null;
  }
}
