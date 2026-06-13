import type { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { claimOnce, releaseClaim } from '../lib/redis';

// Stripe retries a webhook for up to ~3 days; keep idempotency keys at least
// that long so a retried event is never processed twice.
const WEBHOOK_IDEMPOTENCY_TTL = 4 * 24 * 60 * 60;

export async function billingRoutes(app: FastifyInstance) {
  // No apiVersion override — use the version pinned by the installed SDK.
  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

  app.post('/webhook', {
    config: { rawBody: true },
  }, async (req, reply) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return reply.code(400).send({ error: 'Stripe not configured' });
    }

    const sigHeader = req.headers['stripe-signature'];
    const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;
    if (!sig) return reply.code(400).send({ error: 'Missing signature' });

    // rawBody is set by @fastify/rawbody — required for Stripe signature verification
    const rawPayload = req.rawBody;
    if (!rawPayload) return reply.code(400).send({ error: 'Missing raw body' });

    // Type inferred from constructEvent — Stripe.Event is a discriminated
    // union, so the switch below narrows data.object per event type.
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawPayload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return reply.code(400).send({ error: 'Invalid webhook signature' });
    }

    // Idempotency: Stripe delivers at-least-once and retries on any non-2xx or
    // timeout. Claim the event id once; if it was already processed, ack with
    // 200 (so Stripe stops retrying) without re-running the side effects.
    const idempotencyKey = `stripe:evt:${event.id}`;
    const fresh = await claimOnce(idempotencyKey, WEBHOOK_IDEMPOTENCY_TTL);
    if (!fresh) {
      return { received: true, duplicate: true };
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          if (session.client_reference_id) {
            await prisma.user.update({
              where: { id: session.client_reference_id },
              data: {
                plan: 'PRO',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
              },
            });
          }
          break;
        }
        case 'customer.subscription.deleted':
        case 'customer.subscription.paused': {
          const sub = event.data.object;
          await prisma.user.updateMany({
            where: { stripeSubscriptionId: sub.id },
            data: { plan: 'FREE', stripeSubscriptionId: null },
          });
          break;
        }
      }
    } catch (err) {
      // Processing failed after we claimed the event — release the claim so a
      // Stripe retry can re-run the side effects instead of being deduped away.
      await releaseClaim(idempotencyKey);
      req.log.error({ err, eventId: event.id }, 'stripe webhook processing failed');
      return reply.code(500).send({ error: 'Webhook processing failed' });
    }

    return { received: true };
  });

  app.post('/create-checkout', { preHandler: [authenticate] }, async (req, reply) => {
    if (!stripe) {
      return reply.code(400).send({ error: 'Billing not configured on this instance' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) return reply.code(404).send({ error: 'User not found' });
    if (user.plan === 'PRO') return reply.code(400).send({ error: 'Already on Pro plan' });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      client_reference_id: user.id,
      customer_email: user.email,
      line_items: [{
        price: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
        quantity: 1,
      }],
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard?upgraded=true`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/pricing`,
    });

    return { url: session.url };
  });

  app.post('/create-portal', { preHandler: [authenticate] }, async (req, reply) => {
    if (!stripe) return reply.code(400).send({ error: 'Billing not configured' });
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user?.stripeCustomerId) {
      return reply.code(400).send({ error: 'No billing account found' });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`,
    });
    return { url: session.url };
  });
}
