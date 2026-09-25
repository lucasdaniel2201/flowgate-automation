.PHONY: help up down logs ps restart shell n8n-import test smoke-test clean

GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m

.DEFAULT_GOAL := help

help: ## Mostra esta mensagem de ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-14s$(NC) %s\n", $$1, $$2}'

# ============================================================================
# Docker
# ============================================================================

.env: .env.example ## Cria .env a partir do template
	@cp .env.example .env
	@echo "$(YELLOW).env criado a partir do template (os padrões já funcionam).$(NC)"

up: .env ## Sobe o n8n e espera o healthcheck
	@echo "$(GREEN)Iniciando Flowgate...$(NC)"
	@docker compose up -d
	@echo "$(GREEN)Aguardando healthcheck do n8n (pode levar ~1 min no primeiro boot)...$(NC)"
	@timeout 180 bash -c 'until curl -sf http://localhost:5678/healthz > /dev/null 2>&1; do sleep 2; done' \
		|| (echo "$(RED)n8n não ficou saudável a tempo. Veja: make logs$(NC)" && exit 1)
	@echo "$(GREEN)n8n pronto em http://localhost:5678$(NC)"

down: ## Para os serviços (mantém o volume com os dados)
	@docker compose down

clean: ## Para os serviços e apaga o volume (zera workflows e credenciais)
	@docker compose down -v

restart: down up ## Reinicia os serviços

logs: ## Exibe logs dos serviços (follow)
	@docker compose logs -f --tail=100

ps: ## Lista serviços em execução
	@docker compose ps

shell: ## Abre shell no container n8n
	@docker compose exec n8n sh

# ============================================================================
# Workflow
# ============================================================================

n8n-import: ## Importa e ativa workflows/workflow_user_sync.json
	@bash scripts/import-workflow.sh

# ============================================================================
# Qualidade
# ============================================================================

test: ## Roda a suíte de testes estáticos (sem rede, sem containers)
	@node --test "tests/**/*.test.mjs"

smoke-test: ## Teste ponta a ponta (requer o n8n rodando: make up)
	@bash scripts/smoke-test.sh
