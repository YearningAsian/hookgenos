#!/bin/bash
set -e
echo "Starting HookGenOS with Docker..."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

docker compose up -d postgres redis
echo "Waiting for database..."
sleep 5

docker compose run --rm api npx prisma migrate deploy 2>/dev/null || true

docker compose up -d
echo ""
echo "HookGenOS is running at http://localhost:3000"
echo "API: http://localhost:3001"
echo ""
echo "To stop: docker compose down"
