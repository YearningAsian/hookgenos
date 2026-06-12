FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/app/package.json ./packages/app/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @hookgenos/core build
RUN pnpm --filter @hookgenos/app build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hookgenos
COPY --from=builder /app/packages/app/public ./public
COPY --from=builder --chown=hookgenos:nodejs /app/packages/app/.next/standalone ./
COPY --from=builder --chown=hookgenos:nodejs /app/packages/app/.next/static ./.next/static
USER hookgenos
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
