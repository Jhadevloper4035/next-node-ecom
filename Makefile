SHELL := /bin/bash
COMPOSE := docker compose

.PHONY: help env-dev env-prod dev-up dev-down dev-logs dev-rebuild prod-up prod-down prod-logs prod-rebuild clean ps backend-sh frontend-sh

help:
	@echo "Targets:"
	@echo "  env-dev        Create .env.development + frontend/.env.development from examples (won't overwrite)."
	@echo "  env-prod       Create .env.production + frontend/.env.production from examples (won't overwrite)."
	@echo "  dev-up         Start development stack (build if needed)."
	@echo "  dev-down       Stop development stack."
	@echo "  dev-logs       Tail dev logs."
	@echo "  dev-rebuild    Rebuild and restart dev."
	@echo "  prod-up        Start production stack (build if needed)."
	@echo "  prod-down      Stop production stack."
	@echo "  prod-logs      Tail prod logs."
	@echo "  prod-rebuild   Rebuild and restart prod."
	@echo "  ps             Show running containers."
	@echo "  backend-sh     Shell into backend container."
	@echo "  frontend-sh    Shell into frontend container."
	@echo "  clean          Remove containers + volumes (DANGEROUS: deletes DB data)."

env-dev:
	@test -f .env.development || cp .env.development.example .env.development
	@test -f frontend/.env.development || cp frontend/.env.development.example frontend/.env.development
	@echo "✅ Dev env ready."

env-prod:
	@test -f .env.production || cp .env.production.example .env.production
	@test -f frontend/.env.production || cp frontend/.env.production.example frontend/.env.production
	@echo "✅ Prod env ready."

dev-up: 
	$(COMPOSE) up -d  --build

dev-down:
	$(COMPOSE) down

dev-logs:
	$(COMPOSE) logs -f --tail=200

dev-rebuild: env-dev
	$(COMPOSE) down
	$(COMPOSE) up -d --build

prod-up: env-prod
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d --build

prod-down:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml down

prod-logs:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=200

prod-rebuild: env-prod
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml down
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d --build

ps:
	$(COMPOSE) ps

backend-sh:
	$(COMPOSE) exec backend sh

dev-backend-logs:
	docker logs -f ecom_backend 

dev-frontend-logs:
	docker logs -f ecom_frontend

frontend-sh:
	$(COMPOSE) exec frontend sh

clean:
	@echo "⚠️  This will delete containers AND volumes (mongo/redis data)."
	$(COMPOSE) down -v --remove-orphans
