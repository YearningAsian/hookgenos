/**
 * Pure, dependency-free redirect-target sanitizer.
 *
 * Lives in its own module (no `'use client'`, no API/runtime imports) so it can
 * be unit-tested under a plain Node vitest runner without dragging in the
 * Next.js client bundle. Re-exported from `./auth` to keep the public API
 * (`import { safeNextPath } from '@/lib/auth'`) stable.
 *
 * Only same-origin paths are allowed — anything absolute ("https://…"),
 * protocol-relative ("//…"), or backslash-escaped ("/\…") is rejected to
 * prevent open redirects after login/registration.
 */
export function safeNextPath(raw: string | null, fallback = '/dashboard'): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  return raw;
}
