<div align="center">
  <h1>⚡ HookGenOS</h1>
  <p><strong>Open-source viral hook generator for TikTok, Instagram, YouTube, LinkedIn & more</strong></p>
  <p>
    <a href="#quick-start-self-hosted">Self-Host Guide</a> ·
    <a href="CONTRIBUTING.md">Contributing</a>
  </p>
</div>

---

## What is HookGenOS?

HookGenOS is a free, open-source web application that generates high-performing opening hooks for short-form and long-form content. Whether you create on TikTok, Instagram Reels, YouTube Shorts, Twitter/X, or LinkedIn, the first 3 seconds of your content determine whether people stop scrolling — HookGenOS helps you nail it every time.

At its core, the app draws from a library of 60+ battle-tested psychological hook formulas — curiosity gaps, FOMO triggers, contrarian takes, pain-point openers, story lures, and more — that have been distilled from thousands of viral posts across platforms. Every hook is platform-aware: what converts on LinkedIn reads nothing like what stops a TikTok scroll. You enter your topic, choose your platform, and get a set of ready-to-use hooks in seconds.

HookGenOS is open source because great content tools should not be locked behind expensive SaaS subscriptions. Self-hosters can run the entire stack with a single Docker Compose command, connect their own OpenAI key for AI-powered generation, and optionally layer on Stripe to offer a paid tier to their own users. The MIT license means you can fork, modify, and even commercialize — no strings attached.

---

## Features

- **60+ psychological hook formulas** — curiosity gap, FOMO, contrarian, pain point, story, social proof, urgency, listicle, and more
- **Platform-optimized output** — hooks tuned for TikTok, Instagram Reels, YouTube Shorts, Twitter/X, and LinkedIn
- **AI-powered generation via OpenAI** — optional; the app falls back gracefully to template-based generation if no API key is set
- **Free tier included** — 10 hooks per day, no credit card required
- **Pro tier via Stripe** — unlimited hooks, priority generation, and advanced filters ($9/mo)
- **Self-hostable** — single `docker compose up -d` command; bring your own secrets
- **Hook history & favorites** — every generated hook is saved; star the ones you love
- **One-click copy** — clipboard-ready output on every hook card
- **MIT licensed** — fork it, white-label it, make it yours

---

## Quick Start (Self-Hosted)

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | >= 20.19 |
| pnpm | >= 9 |
| PostgreSQL | >= 15 (or use Docker Compose) |
| Redis | Optional — used for rate-limit caching |

---

### Option 1: Docker Compose (recommended)

The fastest path to a running instance. Docker Compose starts PostgreSQL, the API, and the Next.js frontend for you.

```bash
git clone https://github.com/YearningAsian/hookgenos
cd hookgenos
cp .env.example .env
# Edit .env — set JWT_SECRET and any optional keys
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000).

Database migrations run automatically when the API container starts (see `docker/entrypoint.sh`).

To follow logs:

```bash
docker compose logs -f
```

---

### Option 2: Manual Setup

Use this if you want to run against an existing PostgreSQL instance or develop locally.

```bash
git clone https://github.com/YearningAsian/hookgenos
cd hookgenos
pnpm install
cp .env.example .env
```

Open `.env` and set at minimum:

- `DATABASE_URL`
- `JWT_SECRET`

Then:

```bash
# Apply database migrations
pnpm db:migrate

# Start all packages in parallel (API + App + Core watch)
pnpm dev
```

The API starts on [http://localhost:3001](http://localhost:3001) and the Next.js frontend on [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values below. Variables marked **Required** must be set for the app to start. Optional variables unlock specific features — the app degrades gracefully when they are absent.

### Core (Required)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/hookgenos` |
| `JWT_SECRET` | Secret for signing auth tokens — generate with `openssl rand -hex 32` | `a1b2c3...` |
| `APP_URL` | Canonical URL of your frontend (used for CORS and Stripe redirects) | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | URL the frontend uses to reach the API | `http://localhost:3001` |

### OpenAI (Optional — enables AI hooks)

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key. If absent, the app uses template-based generation only. |
| `OPENAI_MODEL` | Model to use (default: `gpt-4o-mini`). Override to use `gpt-4o` or any fine-tuned model. |

### Stripe (Optional — enables Pro billing)

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`). If absent, billing UI is hidden and all users get unlimited access. |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_...` or `pk_test_...`) — used in the frontend checkout flow. |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) — obtained from the Stripe dashboard after registering your endpoint. |
| `STRIPE_PRICE_ID_PRO_MONTHLY` | Price ID for the Pro monthly plan (`price_...`). Create this in your Stripe dashboard. |

### Redis (Optional — rate-limit caching)

| Variable | Description |
|---|---|
| `REDIS_URL` | Redis connection string. If absent, rate limits fall back to in-memory storage (not suitable for multi-instance deployments). |

---

## Premium Subscription (Stripe)

HookGenOS ships with an optional Stripe integration that powers a Pro tier at $9/month. When Stripe is **not** configured, the billing UI is hidden and every user — including anonymous visitors — gets unlimited hook generation. This makes the app work perfectly out of the box for self-hosters who do not want to monetize.

### Setting up Stripe

1. **Create a Stripe account** at [stripe.com](https://stripe.com).

2. **Create a product and price:**
   - Go to **Products** in your Stripe dashboard.
   - Create a product named "HookGenOS Pro".
   - Add a recurring price of $9/month.
   - Copy the **Price ID** (`price_...`) — this becomes `STRIPE_PRICE_ID_PRO_MONTHLY`.

3. **Get your API keys:**
   - Go to **Developers → API keys**.
   - Copy the **Secret key** and **Publishable key** into your `.env`.

4. **Register your webhook endpoint:**
   - Go to **Developers → Webhooks → Add endpoint**.
   - Set the endpoint URL to: `https://yourdomain.com/api/billing/webhook`
   - Select these events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.paused`
   - Copy the **Signing secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

5. **Restart the API** — billing routes activate automatically when the Stripe variables are present.

For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:

```bash
stripe listen --forward-to localhost:3001/api/billing/webhook
```

---

## Architecture

HookGenOS is a TypeScript monorepo managed with **pnpm workspaces** and built with **Turborepo** for caching and parallelization.

```
hookgenos/
├── packages/
│   ├── api/        # Fastify backend — auth, hook generation API, Stripe billing
│   ├── app/        # Next.js 16 frontend — dark-themed UI, Tailwind CSS
│   ├── core/       # Hook generation engine — 60+ templates + OpenAI fallback
│   └── database/   # Prisma schema, migrations, and typed client
├── docker/
│   ├── api.Dockerfile
│   └── app.Dockerfile
├── docker-compose.yml
├── scripts/
│   ├── setup.sh       # First-run setup helper
│   └── docker-start.sh
└── .env.example
```

### How the packages fit together

**`packages/core`** is the heart of the system. It exports a `generateHooks(input)` function that accepts a topic, platform, and tone, then returns a ranked list of hooks. It has no runtime dependencies on the database or HTTP layer — it can be tested in isolation and imported into any Node.js process.

**`packages/api`** is a Fastify server that wraps `core` behind authenticated HTTP routes. It handles JWT issuance and verification, per-user rate limiting, Stripe billing webhooks, and persisting hook history to PostgreSQL via the Prisma client from `packages/database`.

**`packages/database`** owns the Prisma schema and exports a pre-configured `PrismaClient` instance. Migrations live here. Both the API and any scripts import from this package — there is one source of truth for the data model.

**`packages/app`** is a Next.js 16 app with the App Router. It communicates with the API via `NEXT_PUBLIC_API_URL` and stores the API-issued JWT client-side for session management. The UI is built with Tailwind CSS and ships a dark theme by default.

### Request flow

```
Browser → Next.js App (packages/app)
              ↓ fetch /api/*
         Fastify API (packages/api)
              ↓ generateHooks()
         Core Engine (packages/core)
              ↓ OpenAI (optional) / templates
         Response → API → App → Browser
```

---

## Contributing

Contributions are very welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the full development setup, code style guide, and pull request process.

The easiest way to contribute is to **add more hook templates** — it takes about 5 minutes and does not require deep knowledge of the codebase. See the contributing guide for a step-by-step walkthrough.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute. Attribution appreciated but not required.
