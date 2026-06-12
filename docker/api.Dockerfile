FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/api/package.json ./packages/api/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @hookgenos/database generate
RUN pnpm --filter @hookgenos/core build
RUN pnpm --filter @hookgenos/api build

FROM node:24-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hookgenos
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=builder /app/packages/api/package.json ./packages/api/package.json
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/node_modules ./node_modules
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER hookgenos
WORKDIR /app/packages/api
EXPOSE 3001
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/index.js"]
