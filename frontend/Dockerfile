# ─────────────────────────────────────────────────────────────────────────────
#  frontend/Dockerfile — Next.js (dev + production)
#
#  Targets:
#    dev     — hot reload (used by docker-compose.yml)
#    runner  — production runtime image (used by docker-compose.prod.yml)
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

FROM deps AS dev
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["npm","run","dev","--","-p","3000"]

FROM deps AS builder
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/jsconfig.json ./jsconfig.json

USER nextjs
EXPOSE 3000
CMD ["npm","run","start","--","-p","3000"]
