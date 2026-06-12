# @hookgenos/database

Prisma schema, migrations, and typed `PrismaClient` for HookGenOS. All other packages that need database access import from here — there is one source of truth for the data model.

---

## What lives here

```
packages/database/
├── prisma/
│   ├── schema.prisma   # The single source of truth for all tables
│   ├── migrations/     # SQL migration history (0_init is the baseline)
│   └── seed.ts         # Sample-data seed script
├── src/
│   ├── generated/      # Prisma 7 generated client (gitignored, created by db:generate)
│   └── index.ts        # Re-exports PrismaClient + model types + PrismaPg adapter
├── prisma.config.ts    # Prisma CLI config — loads .env, points Migrate at DATABASE_URL
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

This runs `prisma migrate deploy`, which applies migrations without prompting and does not regenerate the client. The Docker API container runs this automatically on start (see `docker/entrypoint.sh`).

### Create a new migration after editing the schema

1. Edit `prisma/schema.prisma` to reflect your intended change.
2. Run `pnpm db:migrate`.

Prisma compares your schema to the current database state, generates the SQL diff, writes it to `prisma/migrations/<timestamp>_<name>/migration.sql`, and applies it. Name your migration descriptively when prompted — for example: `add_hook_favorites`, `add_stripe_customer_id_to_user`.

---

## Seeding

The seed script populates the database with enough sample data to work with the app locally — a demo user and a handful of generated hooks.

```bash
pnpm db:seed
```

The seed script lives at `prisma/seed.ts`. Edit it to add domain-specific fixtures.

Demo user credentials created by the seed (local development only — do not run the seed against a production database):

| Field | Value |
|---|---|
| Email | `demo@hookgenos.com` |
| Password | `password123` |
| Plan | `FREE` |

---

## Prisma Studio

Prisma Studio is a browser-based GUI for browsing and editing database records. Useful for debugging during development.

```bash
pnpm db:studio
```

Opens at [http://localhost:5555](http://localhost:5555).

---

## Importing the Client

Other packages in the monorepo import from this package:

```typescript
import { PrismaClient } from '@hookgenos/database';
```

The API wraps this in a singleton at `packages/api/src/lib/prisma.ts` — import `prisma` from there inside the API rather than instantiating a new client per module.

---

## Schema Overview

| Table | Purpose |
|---|---|
| `users` | Accounts — email, bcrypt password hash, plan tier, Stripe customer/subscription IDs |
| `generated_hooks` | Every generated hook — content, platform, tone, topic, type, score, favorite flag |
| `api_keys` | Hashed API keys per user (reserved for future public-API use) |
| `trending_hooks` | Curated/imported trending hooks shown on the Trending tab, with expiry |

For the full column-level detail, read `prisma/schema.prisma` directly — it is the authoritative reference.

---

## Useful Commands Reference

| Command | Description |
|---|---|
| `pnpm db:migrate` | Apply pending migrations (dev) |
| `pnpm db:migrate:deploy` | Apply pending migrations (production/CI) |
| `pnpm db:seed` | Seed with sample data |
| `pnpm db:studio` | Open Prisma Studio at localhost:5555 |
| `pnpm db:generate` | Regenerate the Prisma client without running migrations |
| `pnpm db:push` | Push schema changes without creating a migration (prototyping only) |

All of these are aliases defined in the root `package.json` and delegate to scripts in this package.
