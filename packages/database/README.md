# @hookgenos/database

Prisma schema, migrations, and typed `PrismaClient` for HookGenOS. All other packages that need database access import from here — there is one source of truth for the data model.

---

## What lives here

```
packages/database/
├── prisma/
│   ├── schema.prisma   # The single source of truth for all tables
│   └── migrations/     # Auto-generated SQL migration history
├── src/
│   └── index.ts        # Exports a pre-configured PrismaClient instance
└── package.json
```

---

## Running Migrations

### Apply all pending migrations (development)

```bash
pnpm db:migrate
```

This runs `prisma migrate dev` from the repo root. It applies any unapplied migrations in `prisma/migrations/` and regenerates the Prisma client.

### Apply migrations in production / CI

```bash
pnpm db:migrate:deploy
```

This runs `prisma migrate deploy`, which applies migrations without prompting and does not regenerate the client. Use this in Docker entrypoints and CI pipelines.

### Create a new migration after editing the schema

1. Edit `prisma/schema.prisma` to reflect your intended change.
2. Run:

```bash
pnpm db:migrate
```

Prisma compares your schema to the current database state, generates the SQL diff, writes it to `prisma/migrations/<timestamp>_<name>/migration.sql`, and applies it.

Name your migration descriptively when prompted — for example: `add_hook_favorites_table`, `add_stripe_customer_id_to_user`.

### Reset the database (destructive — development only)

```bash
pnpm db:reset
```

Drops the database, re-applies all migrations from scratch, and optionally runs the seed script. **Do not run this in production.**

---

## Seeding

The seed script populates the database with enough sample data to work with the app locally — a test user, a handful of generated hooks, and a sample favorites list.

```bash
pnpm db:seed
```

The seed script lives at `prisma/seed.ts`. Edit it to add domain-specific fixtures.

Test user credentials created by the seed:

| Field | Value |
|---|---|
| Email | `test@hookgenos.dev` |
| Password | `password123` |
| Plan | `free` |

---

## Prisma Studio

Prisma Studio is a browser-based GUI for browsing and editing database records. Useful for debugging during development.

```bash
pnpm db:studio
```

Opens at [http://localhost:5555](http://localhost:5555).

---

## Importing the Client

Other packages in the monorepo import the shared client directly:

```typescript
import { prisma } from '@hookgenos/database';

const user = await prisma.user.findUnique({ where: { id } });
```

The `src/index.ts` file instantiates `PrismaClient` once with connection pooling configured and exports it as a named export. Do not instantiate `PrismaClient` directly in other packages.

---

## Schema Overview

| Table | Purpose |
|---|---|
| `User` | Accounts — email, hashed password, plan tier, Stripe customer ID |
| `Session` | JWT refresh token tracking and invalidation |
| `Hook` | Every generated hook — content, platform, tone, topic, timestamp |
| `Favorite` | Join table between `User` and `Hook` for starred hooks |
| `UsageRecord` | Per-day generation counts used for free tier rate limiting |
| `Subscription` | Stripe subscription state — plan, status, current period end |

For the full column-level detail, read `prisma/schema.prisma` directly — it is the authoritative reference and is kept up to date with every migration.

---

## Useful Commands Reference

| Command | Description |
|---|---|
| `pnpm db:migrate` | Apply pending migrations (dev) |
| `pnpm db:migrate:deploy` | Apply pending migrations (production/CI) |
| `pnpm db:reset` | Drop and recreate the database (dev only) |
| `pnpm db:seed` | Seed with sample data |
| `pnpm db:studio` | Open Prisma Studio at localhost:5555 |
| `pnpm db:generate` | Regenerate the Prisma client without running migrations |
| `pnpm db:push` | Push schema changes without creating a migration (prototyping only) |

All of these are aliases defined in the root `package.json` and delegate to the appropriate `prisma` CLI command scoped to this package's schema path.
