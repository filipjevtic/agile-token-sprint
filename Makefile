.PHONY: dev build typecheck test e2e db/migrate db/seed docker/up docker/down help

##@ Development

dev: ## Start server, proxy, and web in parallel (requires docker/up and db/migrate first)
	npx turbo run dev

build: ## Build all apps and packages
	npx turbo run build

typecheck: ## Type-check all apps and packages
	npx turbo run typecheck

test: ## Run unit tests
	npx turbo run test

e2e: ## Run Playwright E2E tests
	npx turbo run e2e

##@ Database

db/migrate: ## Run Prisma migrations
	npm run db:migrate --workspace=apps/server

db/seed: ## Seed demo data
	npm run db:seed --workspace=apps/server

db/generate: ## Generate Prisma client
	npm run db:generate --workspace=apps/server

##@ Docker

docker/up: ## Start Docker Compose services
	docker compose up -d

docker/down: ## Stop Docker Compose services
	docker compose down

docker/logs: ## Tail Docker Compose logs
	docker compose logs -f

##@ Help

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make [target]\n"} /^[a-zA-Z_/-]+:.*?##/ { printf "  %-15s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)