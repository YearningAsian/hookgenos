#!/bin/bash
set -e
echo "🪝 Setting up HookGenOS..."
echo ""

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Installing pnpm..."; npm install -g pnpm; }

# Copy env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — please update with your values"
fi

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

echo ""
echo "Setup complete! Next steps:"
echo "  1. Edit .env with your database URL and secrets"
echo "  2. Run: pnpm db:migrate"
echo "  3. Run: pnpm dev"
echo ""
echo "Or use Docker: docker compose up -d"
