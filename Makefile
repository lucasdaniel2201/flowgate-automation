.PHONY: help up down logs ps build test test-coverage lint typecheck clean shell n8n-import n8n-export all check

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "$(GREEN)Flowgate Automation — Developer Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# ============================================================================
# Docker / Infrastructure
# ============================================================================

up: .env ## Start all services (n8n)
	@echo "$(GREEN)Starting Flowgate services...$(NC)"
	@docker compose up -d
	@echo "$(GREEN)Waiting for n8n healthcheck...$(NC)"
	@timeout 60 bash -c 'until curl -sf http://localhost:5678/healthz > /dev/null 2>&1; do sleep 2; done' || (echo "$(RED)n8n failed to start$(NC)" && exit 1)
	@echo "$(GREEN)n8n is ready at http://localhost:5678$(NC)"

down: ## Stop all services
	@docker compose down

restart: down up ## Restart all services

logs: ## Tail service logs
	@docker compose logs -f --tail=100

ps: ## Show running services
	@docker compose ps

shell: ## Open shell in n8n container
	@docker compose exec n8n sh

n8n-import: ## Import workflow JSON into n8n
	@echo "$(GREEN)Importing workflow into n8n...$(NC)"
	@curl -s -X POST http://localhost:5678/rest/workflows \
		-H "Content-Type: application/json" \
		-d @workflows/workflow_boavista.json | jq .

n8n-export: ## Export active workflow from n8n
	@echo "$(GREEN)Exporting workflow from n8n...$(NC)"
	@curl -s http://localhost:5678/rest/workflows | jq .

# ============================================================================
# TypeScript / Build
# ============================================================================

build: ## Compile TypeScript to JS
	@npx tsup src/index.ts --format esm,cjs --dts --clean

dev: ## Watch mode for development
	@npx tsup src/index.ts --format esm,cjs --dts --watch

cli: ## Run the CLI with sample data
	@npx tsx src/cli/processOrders.cli.ts

# ============================================================================
# Quality
# ============================================================================

lint: ## Run ESLint
	@npx eslint 'src/**/*.ts' --max-warnings 0

lint-fix: ## Run ESLint with auto-fix
	@npx eslint 'src/**/*.ts' --fix

typecheck: ## Run TypeScript type checking (no emit)
	@npx tsc --noEmit

format: ## Format code with Prettier
	@npx prettier --write 'src/**/*.ts' '*.md' '*.json'

format-check: ## Check formatting without changing files
	@npx prettier --check 'src/**/*.ts' '*.md' '*.json'

# ============================================================================
# Testing
# ============================================================================

test: ## Run unit tests
	@npx vitest run

test-watch: ## Run tests in watch mode
	@npx vitest

test-coverage: ## Run tests with coverage report
	@npx vitest run --coverage

test-e2e: ## Run end-to-end tests (requires Docker running)
	@npx vitest run --config vitest.e2e.config.ts

# ============================================================================
# All-in-one check (CI equivalent)
# ============================================================================

check: ## Run full quality pipeline (lint + typecheck + test + build)
	@echo "$(GREEN)=== Lint ===$(NC)"
	@$(MAKE) lint
	@echo "$(GREEN)=== TypeCheck ===$(NC)"
	@$(MAKE) typecheck
	@echo "$(GREEN)=== Tests ===$(NC)"
	@$(MAKE) test-coverage
	@echo "$(GREEN)=== Build ===$(NC)"
	@$(MAKE) build
	@echo "$(GREEN)All checks passed!$(NC)"

# ============================================================================
# Setup
# ============================================================================

.env: .env.example ## Create .env from template
	@cp .env.example .env
	@echo "$(YELLOW).env created from template. Please edit it with your credentials.$(NC)"

install: ## Install dependencies
	@npm ci

prepare: ## Setup git hooks
	@npx husky install

docker-build: ## Build Docker image for the TypeScript library
	@docker build -t flowgate:latest .
