SHELL := /bin/bash
COMPOSE ?= docker compose
PROD_COMPOSE := $(COMPOSE) -f docker-compose.prod.yml --env-file .env.production

.PHONY: help env-dev env-prod dev-up dev-down dev-logs dev-rebuild dev-seed prod-pull prod-up prod-down prod-logs prod-rebuild clean ps backend-sh frontend-sh

help:
	@echo "Targets:"
	@echo "  env-dev        Create .env.development + frontend/.env.development from examples (won't overwrite)."
	@echo "  env-prod       Create .env.production from its example (won't overwrite)."
	@echo "  dev-up         Start development stack (build if needed)."
	@echo "  dev-down       Stop development stack."
	@echo "  dev-logs       Tail dev logs."
	@echo "  dev-rebuild    Rebuild and restart dev."
	@echo "  dev-seed       Seed the running development database."
	@echo "  prod-pull      Pull production images configured in the environment."
	@echo "  prod-up        Start the production image stack."
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

dev-seed:
	$(COMPOSE) exec -T backend node seedDB.js

prod-pull: env-prod
	$(PROD_COMPOSE) pull

prod-up: env-prod
	$(PROD_COMPOSE) up -d --remove-orphans --wait

prod-down:
	$(PROD_COMPOSE) down

prod-logs:
	$(PROD_COMPOSE) logs -f --tail=200

prod-rebuild: env-prod
	$(PROD_COMPOSE) pull
	$(PROD_COMPOSE) up -d --remove-orphans --wait

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
