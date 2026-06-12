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

- **Authentication** — JWT issuance, refresh, and verification middleware
- **Hook routes** — receives generation requests, calls `packages/core`, persists results
- **Billing** — Stripe checkout session creation and webhook handling
- **Rate limiting** — per-user daily quota enforcement (backed by Redis or in-memory)

All API input is validated with [Zod](https://zod.dev/) schemas. Route handlers are thin: they parse input, call a service function, and return the result. Business logic lives in `src/services/`, not in route handlers.

### `packages/app`

A [Next.js 14](https://nextjs.org/) application using the App Router. The UI is built with [Tailwind CSS](https://tailwindcss.com/) and ships a dark theme by default. Key directories:

- `src/app/` — App Router pages and layouts
- `src/components/` — shared React components
- `src/lib/` — API client helpers, auth utilities

The frontend never imports from `packages/core` directly — it always goes through the API. This keeps the generation logic server-side and makes the frontend a thin client.

### `packages/core`

The hook generation engine. This package has **no HTTP dependencies** and no database calls — it is a pure TypeScript library that can be imported anywhere. Key files:

- `src/templates.ts` — the TEMPLATES array: every hook formula lives here
- `src/types.ts` — shared TypeScript types (`Platform`, `Tone`, `Template`, `GeneratedHook`)
- `src/generator.ts` — the `generateHooks()` orchestrator: scores templates, calls OpenAI if available, ranks results
- `src/openai.ts` — the optional OpenAI client wrapper

If you want to add or tweak hooks, you only need to touch `src/templates.ts`.

### `packages/database`

Owns the [Prisma](https://www.prisma.io/) schema, all migrations, and exports a typed `PrismaClient` instance. The API imports the client from here — there is one source of truth for the data model.

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

Open `.env` and fill in the three required variables:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hookgenos
JWT_SECRET=<output of: openssl rand -hex 32>
NEXTAUTH_SECRET=<output of: openssl rand -hex 32>
```

For a fully local setup without Docker, you need a running PostgreSQL instance. If you prefer Docker just for the database:

```bash
docker run -d \
  --name hookgenos-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hookgenos \
  -p 5432:5432 \
  postgres:15
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
| Fastify API | http://localhost:4000 |

Changes to `packages/core` are picked up automatically by the API via TypeScript project references.

### Useful workspace commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start all packages in dev mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run Biome linter across the monorepo |
| `pnpm lint:fix` | Auto-fix lint and format issues |
| `pnpm db:migrate` | Apply pending Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio (visual DB browser) |
| `pnpm db:seed` | Seed the database with sample data |
| `pnpm test` | Run all tests |

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

export type Platform =
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'twitter'
  | 'linkedin';

export type Tone =
  | 'curiosity'
  | 'fomo'
  | 'contrarian'
  | 'pain_point'
  | 'story'
  | 'social_proof'
  | 'urgency'
  | 'listicle';

export interface Template {
  /** Short human-readable name shown in the UI */
  id: string;
  name: string;
  /** The psychological category this hook belongs to */
  tone: Tone;
  /** Platforms this template performs well on */
  platforms: Platform[];
  /** The template string. Use {topic} as the variable placeholder. */
  pattern: string;
  /** Optional: example rendered output for documentation */
  example?: string;
}
```

### Adding a new template

Open `packages/core/src/templates.ts` and add an entry to the exported `TEMPLATES` array:

```typescript
// packages/core/src/templates.ts

export const TEMPLATES: Template[] = [
  // ... existing templates ...

  {
    id: 'uncomfortable-truth',
    name: 'Uncomfortable Truth',
    tone: 'contrarian',
    platforms: ['tiktok', 'twitter', 'linkedin'],
    pattern: 'Nobody wants to hear this about {topic}, but here it is.',
    example: 'Nobody wants to hear this about morning routines, but here it is.',
  },
];
```

Rules to follow:

- `id` must be unique across the entire TEMPLATES array (the build will throw if it is not)
- `pattern` must contain exactly one `{topic}` placeholder
- Only list `platforms` where the hook formula genuinely performs well — do not list all platforms by default
- Keep `pattern` under 120 characters so it fits cleanly as an opening hook without truncation
- Add an `example` — it helps reviewers evaluate the hook without having to run the app

After adding your template, run `pnpm --filter @hookgenos/core test` to make sure the template passes the format validation tests.

---

## How to Add a New Platform

Adding a platform requires touching four places:

### 1. `packages/core/src/types.ts` — extend the `Platform` type

```typescript
// Before
export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'linkedin';

// After
export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'linkedin' | 'threads';
```

### 2. `packages/core/src/templates.ts` — add the new platform to relevant templates

Go through the TEMPLATES array and add `'threads'` to `platforms` on any template you believe performs well there. Add new templates if you have platform-specific hook patterns.

### 3. `packages/core/src/generator.ts` — add platform metadata

The generator uses a `PLATFORM_CONFIG` map to set character limits and weight certain tones. Add an entry for your platform:

```typescript
const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  // ... existing entries ...
  threads: {
    maxLength: 500,
    preferredTones: ['curiosity', 'contrarian', 'story'],
    label: 'Threads',
  },
};
```

### 4. `packages/app/src/components/PlatformSelector.tsx` — add to the UI

The frontend platform selector is a simple array of `{ value, label, icon }` objects. Add your platform there and choose an appropriate icon from the existing icon set.

After making all four changes, run `pnpm dev` and verify:

- The new platform appears in the platform selector
- Generating hooks for that platform returns results
- TypeScript compiles without errors (`pnpm build`)

---

## Pull Request Guidelines

- **One feature or fix per PR.** Large PRs are hard to review and slow to merge. Split unrelated changes.
- **TypeScript throughout.** Do not use `any` without a `// eslint-disable-next-line` comment explaining why it is unavoidable.
- **Test before submitting.** Run `pnpm build` and `pnpm test` locally. PRs that break the build will not be reviewed until fixed.
- **Update docs if behavior changes.** If your PR changes an environment variable, a public API, or the setup process, update `README.md` and this file as part of the same PR.
- **Write a clear PR description.** Explain what the PR does, why it is needed, and how you tested it. Link to any relevant issues.
- **Small template additions** do not need a linked issue — just open the PR directly.
- **New features and architectural changes** should be discussed in an issue first to avoid wasted work.

---

## Code Style

### Formatting

We use [Biome](https://biomejs.dev/) for both linting and formatting. It is configured at the repo root in `biome.json`. Before pushing:

```bash
pnpm lint:fix
```

Your editor can also run Biome on save — install the [Biome VS Code extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome).

### Key conventions

| Convention | Rationale |
|---|---|
| No default exports in `packages/core` or `packages/api` | Named exports are easier to refactor and tree-shake |
| Zod schemas for all API input validation | Ensures runtime safety and auto-generates TypeScript types |
| Service functions in `packages/api/src/services/` | Keeps route handlers thin and testable |
| No database calls in `packages/core` | Keeps the engine portable and independently testable |
| Prefer `const` over `let`; avoid `var` | Reduces mutation bugs |

---

## Good First Issues

If you are new to the codebase, these are the best places to start — each can be completed without a deep understanding of the full stack:

- **Add more hook templates** — open `packages/core/src/templates.ts`, add entries to the TEMPLATES array, open a PR. The most impactful thing you can do.
- **Add a new niche to platform benchmarks** — `packages/core/src/benchmarks.ts` has niche-specific performance data; add a new vertical (fitness, finance, cooking, etc.)
- **Improve landing page copy** — `packages/app/src/app/page.tsx` is the marketing landing page; any copy, layout, or accessibility improvement is welcome
- **Add export to CSV** — hook history is stored in the database but there is no export feature yet; add a route in the API and a download button in the history UI
- **Add a dark/light theme toggle** — the app currently ships dark-only; adding a system-preference-aware toggle would be a great UX improvement
- **Write tests for `packages/core`** — the generator logic has meaningful coverage gaps; adding Vitest unit tests for template rendering and scoring logic is very welcome
