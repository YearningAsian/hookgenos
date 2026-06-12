import type { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export async function billingRoutes(app: FastifyInstance) {
  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any })
    : null;

  app.post('/webhook', {
    config: { rawBody: true },
  }, async (req, reply) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return reply.code(400).send({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      // rawBody is set by @fastify/rawbody — required for Stripe signature verification
      const rawPayload = (req as any).rawBody;
      if (!rawPayload) return reply.code(400).send({ error: 'Missing raw body' });
      event = stripe.webhooks.constructEvent(rawPayload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return reply.code(400).send({ error: 'Invalid webhook signature' });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
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
        const sub = event.data.object as Stripe.Subscription;
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { plan: 'FREE', stripeSubscriptionId: null },
        });
        break;
      }
    }

    return { received: true };
  });

  app.post('/create-checkout', { preHandler: [authenticate] }, async (req, reply) => {
    if (!stripe) {
      return reply.code(400).send({ error: 'Billing not configured on this instance' });
    }
    const payload = req.user as { sub: string; email: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
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
    const payload = req.user as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
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
