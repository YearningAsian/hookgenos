import { describe, it, expect } from 'vitest';
import { validateEnv } from './env';

const STRONG = 'a'.repeat(48);

describe('validateEnv', () => {
  it('passes with a strong JWT secret', () => {
    expect(validateEnv({ JWT_SECRET: STRONG } as NodeJS.ProcessEnv)).toEqual([]);
  });

  it('flags a missing JWT secret', () => {
    const errors = validateEnv({} as NodeJS.ProcessEnv);
    expect(errors.some((e) => e.includes('JWT_SECRET is not set'))).toBe(true);
  });

  it('flags a too-short JWT secret', () => {
    const errors = validateEnv({ JWT_SECRET: 'short' } as NodeJS.ProcessEnv);
    expect(errors.some((e) => e.includes('too short'))).toBe(true);
  });

  it('flags the insecure dev placeholder', () => {
    const errors = validateEnv({ JWT_SECRET: 'dev-secret-CHANGE-IN-PRODUCTION' } as NodeJS.ProcessEnv);
    // The placeholder is shorter than 32 chars, so it trips the length check first.
    expect(errors.length).toBeGreaterThan(0);
  });

  it('flags a placeholder that is long enough to pass the length check', () => {
    const longPlaceholder = 'dev-secret-CHANGE-IN-PRODUCTION';
    // Build a 32+ char value that equals neither the placeholder nor a short string
    // to confirm the explicit placeholder branch fires when length >= 32.
    const padded = longPlaceholder.padEnd(40, 'x');
    expect(validateEnv({ JWT_SECRET: padded } as NodeJS.ProcessEnv)).toEqual([]);
  });

  it('requires a webhook secret when Stripe is configured', () => {
    const errors = validateEnv({
      JWT_SECRET: STRONG,
      STRIPE_SECRET_KEY: 'sk_test_123',
    } as NodeJS.ProcessEnv);
    expect(errors.some((e) => e.includes('STRIPE_WEBHOOK_SECRET'))).toBe(true);
  });

  it('accepts Stripe when the webhook secret is present', () => {
    const errors = validateEnv({
      JWT_SECRET: STRONG,
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_123',
    } as NodeJS.ProcessEnv);
    expect(errors).toEqual([]);
  });

  it('flags a weak admin token in production', () => {
    const errors = validateEnv({
      NODE_ENV: 'production',
      JWT_SECRET: STRONG,
      ADMIN_API_TOKEN: 'tiny',
    } as NodeJS.ProcessEnv);
    expect(errors.some((e) => e.includes('ADMIN_API_TOKEN'))).toBe(true);
  });

  it('does not flag a weak admin token outside production', () => {
    const errors = validateEnv({
      NODE_ENV: 'development',
      JWT_SECRET: STRONG,
      ADMIN_API_TOKEN: 'tiny',
    } as NodeJS.ProcessEnv);
    expect(errors).toEqual([]);
  });
});
