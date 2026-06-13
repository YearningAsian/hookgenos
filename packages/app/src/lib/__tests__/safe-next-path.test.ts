import { describe, it, expect } from 'vitest';
import { safeNextPath } from '../safe-next-path';

describe('safeNextPath', () => {
  describe('falsy / missing input', () => {
    it('returns the default fallback for null', () => {
      expect(safeNextPath(null)).toBe('/dashboard');
    });

    it('returns the default fallback for an empty string', () => {
      expect(safeNextPath('')).toBe('/dashboard');
    });

    it('honors a custom fallback', () => {
      expect(safeNextPath(null, '/settings')).toBe('/settings');
      expect(safeNextPath('', '/settings')).toBe('/settings');
    });
  });

  describe('accepts safe same-origin relative paths', () => {
    it('accepts a simple root-relative path', () => {
      expect(safeNextPath('/dashboard')).toBe('/dashboard');
    });

    it('accepts a nested path', () => {
      expect(safeNextPath('/dashboard/history')).toBe('/dashboard/history');
    });

    it('accepts a path with query string and fragment', () => {
      expect(safeNextPath('/dashboard?tab=hooks#top')).toBe('/dashboard?tab=hooks#top');
    });

    it('accepts the bare root path', () => {
      expect(safeNextPath('/')).toBe('/');
    });
  });

  describe('rejects open-redirect vectors', () => {
    it('rejects absolute http URLs', () => {
      expect(safeNextPath('http://evil.com')).toBe('/dashboard');
    });

    it('rejects absolute https URLs', () => {
      expect(safeNextPath('https://evil.com/dashboard')).toBe('/dashboard');
    });

    it('rejects protocol-relative URLs (//host)', () => {
      expect(safeNextPath('//evil.com')).toBe('/dashboard');
      expect(safeNextPath('//evil.com/dashboard')).toBe('/dashboard');
    });

    it('rejects backslash-after-slash tricks (/\\host)', () => {
      expect(safeNextPath('/\\evil.com')).toBe('/dashboard');
      expect(safeNextPath('/\\/evil.com')).toBe('/dashboard');
    });

    it('rejects inputs not starting with a slash', () => {
      expect(safeNextPath('evil.com')).toBe('/dashboard');
      expect(safeNextPath('dashboard')).toBe('/dashboard');
    });

    it('rejects a leading backslash', () => {
      expect(safeNextPath('\\evil.com')).toBe('/dashboard');
      expect(safeNextPath('\\\\evil.com')).toBe('/dashboard');
    });

    it('rejects scheme-relative javascript/data URIs (no leading slash)', () => {
      expect(safeNextPath('javascript:alert(1)')).toBe('/dashboard');
      expect(safeNextPath('data:text/html,<script>1</script>')).toBe('/dashboard');
    });

    it('returns the provided fallback (not the default) when rejecting', () => {
      expect(safeNextPath('https://evil.com', '/home')).toBe('/home');
      expect(safeNextPath('//evil.com', '/home')).toBe('/home');
    });
  });
});
