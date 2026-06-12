# Contributing to HookGenOS

Thank you for taking the time to contribute. HookGenOS is intentionally structured so that the most impactful contributions — adding hook templates and platform support — require almost no framework knowledge. This guide walks through the full development setup as well as the most common contribution paths.

---

## Table of Contents

- [Project structure](#project-structure)
- [Development setup](#development-setup)
- [How to add hook templates](#how-to-add-hook-templates)
- [How to add a new platform](#how-to-add-a-new-platform)
- [Pull request guidelines](#pull-request-guidelines)
- [Code style](#code-style)
- [Good first issues](#good-first-issues)

---

## Project Structure

```
hookgenos/
├── packages/
│   ├── api/        # Fastify backend
│   ├── app/        # Next.js 14 frontend
│   ├── core/       # Hook generation engine
│   └── database/   # Prisma schema
```

### `packages/api`

A [Fastify](https://fastify.dev/) HTTP server written in TypeScript. Responsible for:

- **Authentication** — JWT issuance and verification (`src/routes/auth.ts`, `src/middleware/auth.ts`)
- **Hook routes** — receives generation requests, calls `packages/core`, persists results (`src/routes/hooks.ts`)
- **Billing** — Stripe checkout session creation and webhook handling (`src/routes/billing.ts`)
- **Rate limiting** — global per-IP limits plus a per-user daily quota for the free plan

All API input is validated with [Zod](https://zod.dev/) schemas at the route boundary.

### `packages/app`

A [Next.js 14](https://nextjs.org/) application using the App Router. The UI is built with [Tailwind CSS](https://tailwindcss.com/) and ships a dark theme by default. Key directories:

- `src/app/` — App Router pages and layouts
- `src/components/` — shared React components
- `src/lib/` — API client helpers (`api.ts`), auth utilities (`auth.ts`)

The frontend never imports from `packages/core` directly — it always goes through the API. This keeps the generation logic server-side and makes the frontend a thin client.

### `packages/core`

The hook generation engine. This package has **no HTTP dependencies** and no database calls — it is a pure TypeScript library that can be imported anywhere. Key files:

- `src/templates.ts` — the `TEMPLATES` array: every hook formula lives here
- `src/types.ts` — shared TypeScript types (`Platform`, `Tone`, `HookType`, `Template`, `Hook`)
- `src/generator.ts` — `generateHooks()`: fills templates, scores them per platform, and optionally calls OpenAI (falling back to templates on any failure)

If you want to add or tweak hooks, you only need to touch `src/templates.ts`.

### `packages/database`

Owns the [Prisma](https://www.prisma.io/) schema, all migrations, and exports a typed `PrismaClient`. The API imports the client from here — there is one source of truth for the data model.

---

## Development Setup

### 1. Fork and clone

```bash
git clone https://github.com/YOUR_USERNAME/hookgenos
cd hookgenos
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required variables:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hookgenos
JWT_SECRET=<output of: openssl rand -hex 32>
```

For a fully local setup without Docker, you need a running PostgreSQL instance. If you prefer Docker just for the database:

```bash
docker run -d \
  --name hookgenos-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hookgenos \
  -p 127.0.0.1:5432:5432 \
  postgres:16
```

### 4. Run migrations

```bash
pnpm db:migrate
```

### 5. Start the development servers

```bash
pnpm dev
```

Turborepo starts all packages in parallel with live reload:

| Service | URL |
|---|---|
| Next.js frontend | http://localhost:3000 |
| Fastify API | http://localhost:3001 |

### Useful workspace commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start all packages in dev mode |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm test` | Run all tests |
| `pnpm db:migrate` | Apply pending Prisma migrations (dev) |
| `pnpm db:migrate:deploy` | Apply pending migrations (production/CI) |
| `pnpm db:seed` | Seed the database with sample data |
| `pnpm db:studio` | Open Prisma Studio (visual DB browser) |

To run a command in a single package, use the `--filter` flag:

```bash
pnpm --filter @hookgenos/core test
pnpm --filter @hookgenos/api dev
```

---

## How to Add Hook Templates

This is the most common — and most impactful — contribution. Adding a template takes about 5 minutes and touches exactly one file: `packages/core/src/templates.ts`.

### The `Template` interface

```typescript
// packages/core/src/types.ts

export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'linkedin' | 'general';
export type Tone = 'casual' | 'professional' | 'urgent' | 'curious' | 'bold';

export interface Template {
  /** Unique id, e.g. 'c13' (curiosity #13) */
  id: string;
  /** The psychological category this hook belongs to */
  type: HookType;
  /** The template string. {topic}, {niche}, and {number} are placeholders. */
  template: string;
  /** Base score 0-100 — how strongly this formula performs */
  score: number;
  /** Platforms this template performs well on */
  platforms: Platform[];
  /** Tones this template fits */
  tones: Tone[];
  /** Example rendered output for documentation */
  example: string;
}
```

### Adding a new template

Open `packages/core/src/templates.ts` and add an entry to the exported `TEMPLATES` array:

```typescript
export const TEMPLATES: Template[] = [
  // ... existing templates ...

  {
    id: 'ct9',
    type: 'contrarian',
    template: 'Nobody wants to hear this about {topic}, but here it is',
    score: 86,
    platforms: ['tiktok', 'twitter', 'linkedin'],
    tones: ['bold', 'casual'],
    example: 'Nobody wants to hear this about morning routines, but here it is',
  },
];
```

Rules to follow:

- `id` must be unique across the entire `TEMPLATES` array
- `template` must contain at least one `{topic}` placeholder; `{niche}` and `{number}` are optional
- Only list `platforms` where the hook formula genuinely performs well — do not list all platforms by default
- Keep the template under 120 characters so it fits cleanly as an opening hook without truncation
- Add an `example` — it helps reviewers evaluate the hook without having to run the app

After adding your template, run `pnpm typecheck` to make sure it compiles.

---

## How to Add a New Platform

Adding a platform requires touching these places:

### 1. `packages/core/src/types.ts` — extend the `Platform` type

```typescript
export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'linkedin' | 'general' | 'threads';
```

### 2. `packages/core/src/templates.ts` — tag relevant templates

Go through the `TEMPLATES` array and add your platform to `platforms` on any template you believe performs well there. Add new templates if you have platform-specific hook patterns.

### 3. `packages/core/src/generator.ts` — optional scoring bonus

The generator uses a `PLATFORM_BONUS` map to weight scores per platform. Add an entry if your platform deserves one.

### 4. `packages/api/src/routes/hooks.ts` — allow the platform in the API

Add your platform to the `platform` enum in `generateSchema`.

### 5. Frontend selectors

The platform pickers are simple arrays named `PLATFORMS` in `packages/app/src/components/HookGenerator.tsx`, `packages/app/src/components/TrendingHooks.tsx`, and `packages/app/src/app/dashboard/history/page.tsx`. Add your platform to each.

After making the changes, run `pnpm dev` and verify:

- The new platform appears in the platform selector
- Generating hooks for that platform returns results
- TypeScript compiles without errors (`pnpm typecheck && pnpm build`)

---

## Pull Request Guidelines

- **One feature or fix per PR.** Large PRs are hard to review and slow to merge. Split unrelated changes.
- **TypeScript throughout.** Do not use `any` without a comment explaining why it is unavoidable.
- **Test before submitting.** Run `pnpm build`, `pnpm typecheck`, and `pnpm lint` locally. PRs that break the build will not be reviewed until fixed.
- **Update docs if behavior changes.** If your PR changes an environment variable, a public API, or the setup process, update `README.md` and this file as part of the same PR.
- **Write a clear PR description.** Explain what the PR does, why it is needed, and how you tested it. Link to any relevant issues.
- **Small template additions** do not need a linked issue — just open the PR directly.
- **New features and architectural changes** should be discussed in an issue first to avoid wasted work.

---

## Code Style

- TypeScript strict mode is on everywhere (see `tsconfig.base.json`).
- The frontend is linted with ESLint via `next lint` (`pnpm lint`).
- Zod schemas validate all API input at route boundaries.
- No database calls in `packages/core` — keep the engine portable and independently testable.
- Prefer `const` over `let`; avoid `var`; prefer named exports.

---

## Good First Issues

If you are new to the codebase, these are the best places to start — each can be completed without a deep understanding of the full stack:

- **Add more hook templates** — open `packages/core/src/templates.ts`, add entries to the `TEMPLATES` array, open a PR. The most impactful thing you can do.
- **Improve landing page copy** — `packages/app/src/app/page.tsx` is the marketing landing page; any copy, layout, or accessibility improvement is welcome.
- **Add export to CSV** — hook history is stored in the database but there is no export feature yet; add a route in the API and a download button in the history UI.
- **Add a dark/light theme toggle** — the app currently ships dark-only; adding a system-preference-aware toggle would be a great UX improvement.
- **Write tests for `packages/core`** — the generator has no automated tests yet; adding unit tests for template rendering and scoring logic is very welcome.
