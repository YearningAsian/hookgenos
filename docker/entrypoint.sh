#!/bin/sh
set -e

echo "[hookgenos] Running database migrations…"
# Absolute paths; WORKDIR in runner stage is /app/packages/api
node /app/node_modules/.bin/prisma migrate deploy \
  --schema /app/packages/database/prisma/schema.prisma

echo "[hookgenos] Migrations complete. Starting API…"
exec "$@"
