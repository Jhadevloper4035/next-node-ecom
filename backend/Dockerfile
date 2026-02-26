# ─────────────────────────────────────────────────────────────────────────────
#  Dockerfile — node-auth-mvc
#
#  Stages:
#    base        — all deps including devDeps (used by docker-compose dev)
#    production  — prod deps only, non-root user (used by docker-compose prod)
# ─────────────────────────────────────────────────────────────────────────────

# ── base (dev + prod deps) ────────────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

# Install ALL deps (including devDeps like nodemon) for the dev compose target
RUN npm install --ignore-scripts

COPY . .

# ── production (lean, hardened) ───────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Create a non-root user to run the app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./

# Production deps only (+ optional redis deps if REDIS_URL is set at runtime)
RUN npm ci --omit=dev --ignore-scripts

COPY --chown=appuser:appgroup src ./src

USER appuser

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
