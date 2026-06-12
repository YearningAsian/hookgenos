#!/bin/sh
set -e

echo "[hookgenos] Running database migrations…"
# Prisma 7: schema + datasource URL come from prisma.config.ts
# (DATABASE_URL is provided by the container environment).
# Absolute paths; WORKDIR in runner stage is /app/packages/api
node /app/node_modules/.bin/prisma migrate deploy \
  --config /app/packages/database/prisma.config.ts

echo "[hookgenos] Migrations complete. Starting API…"
exec "$@"
