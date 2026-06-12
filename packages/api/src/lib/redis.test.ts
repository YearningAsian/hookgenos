import { describe, it, expect } from 'vitest';

// No REDIS_URL in the test env → claimOnce/releaseClaim use the in-memory path.
import { claimOnce, releaseClaim } from './redis';

describe('claimOnce / releaseClaim (in-memory idempotency)', () => {
  it('returns true the first time a key is claimed', async () => {
    expect(await claimOnce('evt:first', 60)).toBe(true);
  });

  it('returns false on a repeat claim of the same key', async () => {
    await claimOnce('evt:dup', 60);
    expect(await claimOnce('evt:dup', 60)).toBe(false);
    expect(await claimOnce('evt:dup', 60)).toBe(false);
  });

  it('treats distinct keys independently', async () => {
    expect(await claimOnce('evt:a', 60)).toBe(true);
    expect(await claimOnce('evt:b', 60)).toBe(true);
  });

  it('allows re-claiming after release (retry-after-failure path)', async () => {
    expect(await claimOnce('evt:retry', 60)).toBe(true);
    expect(await claimOnce('evt:retry', 60)).toBe(false);
    await releaseClaim('evt:retry');
    expect(await claimOnce('evt:retry', 60)).toBe(true);
  });
});
