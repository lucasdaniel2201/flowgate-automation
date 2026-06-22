#!/usr/bin/env bash
# =============================================================================
# Flowgate Automation — Smoke Test
# =============================================================================
# Valida que o n8n está saudável e o workflow responde.
# Requer: docker compose up rodando.
# Uso: bash scripts/smoke-test.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
PASS=0
FAIL=0

check() {
  local desc="$1"
  shift
  if "$@" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $desc"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Smoke Test: Flowgate Automation ==="
echo ""

# 1. Container está rodando
check "n8n container is running" docker compose ps n8n --format json

# 2. Healthcheck passou
check "n8n healthcheck is healthy" \
  curl -sf http://localhost:5678/healthz

# 3. Métricas respondem
check "Prometheus metrics endpoint" \
  curl -sf http://localhost:5678/metrics

# 4. Webhook do workflow responde
WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:5678/webhook/iniciar 2>/dev/null || echo "")
if echo "$WEBHOOK_RESPONSE" | grep -q "executionTime"; then
  echo -e "  ${GREEN}✓${NC} webhook trigger responds with executionTime"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}✗${NC} webhook trigger failed or returned unexpected response"
  FAIL=$((FAIL + 1))
fi

# 5. Workflow JSON é válido
check "workflow JSON is valid" \
  node -e "JSON.parse(require('fs').readFileSync('workflows/workflow_boavista.json','utf-8'))"

echo ""
echo "Resultado: ${GREEN}$PASS passaram${NC}, ${RED}$FAIL falharam${NC}"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
