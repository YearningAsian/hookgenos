import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

// Mock the Stripe SDK so we can drive constructEvent without real signatures.
const constructEvent = vi.fn();
vi.mock('stripe', () => {
  return {
    default: class StripeMock {
      webhooks = { constructEvent };
      checkout = { sessions: { create: vi.fn() } };
      billingPortal = { sessions: { create: vi.fn() } };
    },
  };
});

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: { update: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock('../lib/redis', () => ({
  redis: null,
  getCached: vi.fn((_k: string, _t: number, fn: () => unknown) => fn()),
  // Real-ish in-memory idempotency so the dedup behaviour is exercised.
  claimOnce: (() => {
    const seen = new Set<string>();
    return vi.fn(async (key: string) => {
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })(),
  releaseClaim: vi.fn(),
}));

import { buildApp } from '../index';
import { prisma } from '../lib/prisma';

describe('POST /api/billing/webhook', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    app = await buildApp();
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  beforeEach(() => {
    constructEvent.mockReset();
    vi.mocked(prisma.user.update).mockReset().mockResolvedValue({} as never);
    vi.mocked(prisma.user.updateMany).mockReset().mockResolvedValue({ count: 1 } as never);
  });

  it('rejects a missing stripe-signature header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      payload: { any: 'thing' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects an invalid signature (constructEvent throws)', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('bad sig');
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      headers: { 'stripe-signature': 'sig_bad' },
      payload: { any: 'thing' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/signature/i);
  });

  it('upgrades the user on checkout.session.completed', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_checkout_1',
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'user-1', customer: 'cus_1', subscription: 'sub_1' } },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      headers: { 'stripe-signature': 'sig_ok' },
      payload: { id: 'evt_checkout_1' },
    });
    expect(res.statusCode).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    expect(vi.mocked(prisma.user.update).mock.calls[0][0]).toMatchObject({
      where: { id: 'user-1' },
      data: { plan: 'PRO' },
    });
  });

  it('is idempotent — a replayed event id is not processed twice', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_replay',
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'user-2', customer: 'cus_2', subscription: 'sub_2' } },
    });

    const first = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      headers: { 'stripe-signature': 'sig_ok' },
      payload: { id: 'evt_replay' },
    });
    const second = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      headers: { 'stripe-signature': 'sig_ok' },
      payload: { id: 'evt_replay' },
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(second.json().duplicate).toBe(true);
    // The DB write happened exactly once across both deliveries.
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
  });

  it('downgrades on customer.subscription.deleted', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_del_1',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_9' } },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      headers: { 'stripe-signature': 'sig_ok' },
      payload: { id: 'evt_del_1' },
    });
    expect(res.statusCode).toBe(200);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_9' },
      data: { plan: 'FREE', stripeSubscriptionId: null },
    });
  });
});
