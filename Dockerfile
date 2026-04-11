FROM node:22-alpine AS base
RUN npm install -g pnpm turbo

# ─── Étape 1 : prune ──────────────────────────────────────────────────────────
# turbo prune crée un sous-ensemble minimal du monorepo pour @warforge/web
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @warforge/web --docker

# ─── Étape 2 : deps ───────────────────────────────────────────────────────────
# Installe uniquement les dépendances nécessaires (layer mis en cache par Docker)
FROM base AS deps
WORKDIR /app

# Copie d'abord uniquement les package.json (optimise le cache Docker)
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# ─── Étape 3 : builder ────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .

# Variables nécessaires au build (pas de secrets ici, uniquement les URLs publiques)
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN turbo run build --filter=@warforge/web

# ─── Étape 4 : runner ─────────────────────────────────────────────────────────
# Image finale la plus légère possible
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Désactive la télémétrie Next.js
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public

# Utilise le mode standalone de Next.js (bundle tout en un seul dossier)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
