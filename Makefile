.PHONY: help up down logs ps restart shell n8n-import n8n-export

GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m

.DEFAULT_GOAL := help

help: ## Mostra esta mensagem de ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-18s$(NC) %s\n", $$1, $$2}'

# ============================================================================
# Docker / Infraestrutura
# ============================================================================

up: .env ## Sobe todos os serviços (n8n)
	@echo "$(GREEN)Iniciando Flowgate...$(NC)"
	@docker compose up -d
	@echo "$(GREEN)Aguardando healthcheck do n8n...$(NC)"
	@timeout 60 bash -c 'until curl -sf http://localhost:5678/healthz > /dev/null 2>&1; do sleep 2; done' || (echo "$(RED)n8n falhou ao iniciar$(NC)" && exit 1)
	@echo "$(GREEN)n8n pronto em http://localhost:5678$(NC)"

down: ## Para todos os serviços
	@docker compose down

restart: down up ## Reinicia todos os serviços

logs: ## Exibe logs dos serviços (follow)
	@docker compose logs -f --tail=100

ps: ## Lista serviços em execução
	@docker compose ps

shell: ## Abre shell no container n8n
	@docker compose exec n8n sh

n8n-import: ## Importa o workflow JSON para o n8n
	@echo "$(GREEN)Importando workflow...$(NC)"
	@curl -s -X POST http://localhost:5678/rest/workflows \
		-H "Content-Type: application/json" \
		-d @workflows/workflow_boavista.json

n8n-export: ## Exporta o workflow ativo do n8n
	@curl -s http://localhost:5678/rest/workflows

# ============================================================================
# Setup
# ============================================================================

.env: .env.example ## Cria .env a partir do template
	@cp .env.example .env
	@echo "$(YELLOW).env criado. Edite com suas credenciais.$(NC)"

install: ## Instala dependências (commitlint + husky)
	@npm ci
	@npx husky install

smoke-test: ## Teste de sanidade (requer n8n rodando)
	@bash scripts/smoke-test.sh
