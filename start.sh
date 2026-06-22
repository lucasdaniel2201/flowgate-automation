#!/usr/bin/env bash
# =============================================================================
# Flowgate Automation — Startup Script
# =============================================================================
# This script validates the environment and starts the n8n service.
# Usage: bash start.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ------------------------------------------------------------------
# 1. Validate .env file
# ------------------------------------------------------------------
echo -e "${GREEN}=== Flowgate Automation ===${NC}"

if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found.${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Created .env from .env.example.${NC}"
        echo -e "${RED}Please edit .env with your actual credentials before proceeding.${NC}"
        echo -e "${YELLOW}Then re-run this script.${NC}"
        exit 1
    else
        echo -e "${RED}Error: .env.example not found. Cannot create .env.${NC}"
        exit 1
    fi
fi

# Source .env (only safe variables, no secrets exported)
set -a
# shellcheck disable=SC1090
source .env
set +a

# ------------------------------------------------------------------
# 2. Validate required credentials
# ------------------------------------------------------------------
if [ "${N8N_BASIC_AUTH_PASSWORD:-}" = "change-me-in-production" ] || [ "${N8N_BASIC_AUTH_PASSWORD:-}" = "senha_segura" ]; then
    echo -e "${RED}Error: You are using a placeholder password in .env${NC}"
    echo -e "${YELLOW}Please set a strong password for N8N_BASIC_AUTH_PASSWORD.${NC}"
    exit 1
fi

# ------------------------------------------------------------------
# 3. Start services
# ------------------------------------------------------------------
echo -e "${GREEN}Starting n8n container...${NC}"
docker compose up -d

# ------------------------------------------------------------------
# 4. Wait for healthcheck
# ------------------------------------------------------------------
echo -e "${YELLOW}Waiting for n8n to become healthy...${NC}"
MAX_WAIT=${N8N_STARTUP_TIMEOUT:-60}
WAITED=0
INTERVAL=2

until curl -sf "http://localhost:${N8N_PORT:-5678}/healthz" > /dev/null 2>&1; do
    WAITED=$((WAITED + INTERVAL))
    if [ "$WAITED" -ge "$MAX_WAIT" ]; then
        echo -e "${RED}Error: n8n did not become healthy within ${MAX_WAIT}s${NC}"
        echo -e "${YELLOW}Check logs: docker compose logs${NC}"
        exit 1
    fi
    sleep "$INTERVAL"
done

# ------------------------------------------------------------------
# 5. Success
# ------------------------------------------------------------------
echo ""
echo -e "${GREEN}=== n8n is running! ===${NC}"
echo -e "  URL:       ${GREEN}http://localhost:${N8N_PORT:-5678}${NC}"
echo -e "  User:      ${N8N_BASIC_AUTH_USER:-admin}"
echo -e "  Password:  ****"
echo ""
echo -e "${YELLOW}Import the workflow:${NC}"
echo -e "  make n8n-import"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo -e "  make logs"
echo ""
echo -e "${YELLOW}Stop:${NC}"
echo -e "  make down"
