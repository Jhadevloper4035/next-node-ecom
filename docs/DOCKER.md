# Docker / Compose setup (Dev + Prod)

This repo contains **backend** (Node/Express) and **frontend** (Next.js).

## Prerequisites
- Docker Desktop / Docker Engine
- Docker Compose v2 (`docker compose`)

---

## Development (recommended)

### 1) Create env files
```bash
cp .env.development.example .env.development
cp frontend/.env.development.example frontend/.env.development
```

### 2) Start
```bash
docker compose up --build
# or
make dev-up
```

### 3) URLs
- Frontend: http://localhost:3000
- Backend:  http://localhost:5000/api/v1
- Mailpit:  http://localhost:8025
- Mongo UI: http://localhost:8081

---

## Production

### 1) Create env files
```bash
cp .env.production.example .env.production
cp frontend/.env.production.example frontend/.env.production
```

### 2) Start
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
# or
make prod-up
```

Notes:
- `mongo` and `redis` ports are **not** exposed in production.
- `mailpit` is disabled in production; set real SMTP credentials in `.env.production`.

---

## Makefile commands
```bash
make help
make dev-up
make dev-logs
make dev-down

make prod-up
make prod-logs
make prod-down
```
