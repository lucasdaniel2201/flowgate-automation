#!/usr/bin/env bash
# =============================================================================
# Flowgate Automation — Startup Script
# =============================================================================
# Sobe o n8n e espera o healthcheck. É o caminho sem `make`, para quem não tem
# o GNU Make instalado.
#
# Uso: bash start.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

HOST_PORT="${N8N_PORT:-5678}"

echo -e "${GREEN}=== Flowgate Automation ===${NC}"
echo ""

# ------------------------------------------------------------------
# 1. .env
# ------------------------------------------------------------------
if [ ! -f .env ]; then
    if [ ! -f .env.example ]; then
        echo -e "${RED}Erro: .env.example não encontrado, não dá para criar o .env.${NC}"
        exit 1
    fi
    cp .env.example .env
    echo -e "${YELLOW}.env criado a partir de .env.example.$(NC)"
    echo -e "Os padrões já funcionam: o pipeline aponta para APIs públicas de teste."
    echo ""
fi

# ------------------------------------------------------------------
# 2. Subir os serviços
# ------------------------------------------------------------------
echo -e "${GREEN}Subindo o container do n8n...${NC}"
docker compose up -d

# ------------------------------------------------------------------
# 3. Esperar o healthcheck
# ------------------------------------------------------------------
echo -e "${YELLOW}Aguardando o healthcheck (o primeiro boot pode levar ~1 min)...${NC}"
MAX_WAIT="${N8N_STARTUP_TIMEOUT:-180}"
WAITED=0

until curl -sf "http://localhost:${HOST_PORT}/healthz" > /dev/null 2>&1; do
    WAITED=$((WAITED + 2))
    if [ "$WAITED" -ge "$MAX_WAIT" ]; then
        echo -e "${RED}Erro: o n8n não ficou saudável em ${MAX_WAIT}s.${NC}"
        echo -e "${YELLOW}Veja os logs: docker compose logs${NC}"
        exit 1
    fi
    sleep 2
done

# ------------------------------------------------------------------
# 4. Próximos passos
# ------------------------------------------------------------------
echo ""
echo -e "${GREEN}=== n8n no ar ===${NC}"
echo -e "  Editor:    ${GREEN}http://localhost:${HOST_PORT}${NC}"
echo -e "  Métricas:  ${GREEN}http://localhost:${HOST_PORT}/metrics${NC}"
echo -e "  Healthz:   ${GREEN}http://localhost:${HOST_PORT}/healthz${NC}"
echo ""
echo -e "${YELLOW}Na primeira visita o n8n pede para você criar a conta de dono do"
echo -e "instância — não há basic auth.${NC}"
echo ""
echo -e "${YELLOW}Importar e ativar o workflow:${NC}"
echo -e "  bash scripts/import-workflow.sh"
echo ""
echo -e "${YELLOW}Rodar o pipeline:${NC}"
echo -e "  curl -X POST http://localhost:${HOST_PORT}/webhook/iniciar"
echo ""
echo -e "${YELLOW}Parar:${NC}"
echo -e "  docker compose down"
