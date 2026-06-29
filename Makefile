.PHONY: dev build typecheck test e2e db/migrate docker/up docker/down help

##@ Development

dev: ## Start server, proxy, and web in parallel (requires docker/up and db/migrate first)
	npm run dev --workspaces --if-present

build: ## Build all apps and packages
	npm run build --workspaces --if-present

typecheck: ## Type-check all apps and packages
	npm run typecheck --workspaces --if-present

test: ## Run unit tests
	npm run test --workspaces --if-present

e2e: ## Run Playwright E2E tests
	npm run e2e --workspace=apps/web

##@ Database

db/migrate: ## Run Prisma migrations
	DATABASE_URL=postgresql://ats:ats@localhost:5432/ats npm run db:migrate --workspace=apps/server

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
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make [target]\n"} /^[a-zA-Z_\/.-]+:.*?##/ { printf "  %-15s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)