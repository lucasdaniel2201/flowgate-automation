#!/usr/bin/env bash
# =============================================================================
# Flowgate Automation — Smoke Test
# =============================================================================
# Imports the workflow, triggers it over the production webhook and checks the
# summary it returns. Everything runs against the public fake API that
# .env.example points at, so no credentials are needed.
#
# Requires: `docker compose up -d` already running.
# Usage:    bash scripts/smoke-test.sh
# =============================================================================

set -euo pipefail

WORKFLOW_FILE="workflows/workflow_user_sync.json"
CONTAINER="${N8N_CONTAINER:-flowgate-n8n}"
HOST_PORT="${N8N_PORT:-5678}"
BASE_URL="http://localhost:${HOST_PORT}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
PASS=0
FAIL=0

ok() {
  echo -e "  ${GREEN}ok${NC}   $1"
  PASS=$((PASS + 1))
}

bad() {
  echo -e "  ${RED}FAIL${NC} $1"
  FAIL=$((FAIL + 1))
}

check() {
  local description="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    ok "$description"
  else
    bad "$description"
  fi
}

# `docker inspect` exits 0 for a container that exists but is stopped, so it
# cannot answer "is it running?" on its own.
is_running() {
  [ "$(docker inspect --format '{{.State.Running}}' "$1" 2>/dev/null || echo false)" = "true" ]
}

# /healthz responde antes de o resto da API ficar pronto — o /metrics, em
# particular, só passa a responder alguns segundos depois. Por isso os checks
# de HTTP tentam várias vezes em vez de olhar uma vez só.
wait_for_http() {
  local url="$1"
  local attempts="${2:-30}"
  for _ in $(seq 1 "$attempts"); do
    if curl -sf "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# O n8n só exporta n8n_active_workflow_count quando existe pelo menos um
# workflow ativo — numa instância recém-subida a série simplesmente não existe.
# Por isso esta checagem roda depois da ativação, e falha tanto se a métrica
# sumir quanto se ela vier zerada.
metrics_report_active_workflow() {
  local value
  value="$(curl -sf "${BASE_URL}/metrics" | awk '$1 == "n8n_active_workflow_count" { print $2; exit }')"
  [ -n "$value" ] && [ "$value" -ge 1 ]
}

echo "=== Smoke Test: Flowgate Automation ==="
echo ""

echo "Infraestrutura"
check "container $CONTAINER is running" is_running "$CONTAINER"
check "GET /healthz returns 200" wait_for_http "${BASE_URL}/healthz"
check "GET /metrics returns 200" wait_for_http "${BASE_URL}/metrics" 10
check "workflow JSON parses" \
  node -e "JSON.parse(require('fs').readFileSync('$WORKFLOW_FILE', 'utf-8'))"

echo ""
echo "Workflow"
IMPORT_OK=0
if bash scripts/import-workflow.sh "$WORKFLOW_FILE"; then
  ok "workflow imported and activated"
  IMPORT_OK=1
else
  bad "workflow imported and activated"
fi

# Sem o workflow ativo não faz sentido disparar o webhook; os checks de pipeline
# seriam só ruído em cima da falha real.
if [ "$IMPORT_OK" = "1" ]; then
  echo ""
  echo "Pipeline"
  # docs/observability.md promete esta métrica, e ela também é a prova de que a
  # ativação pegou: só aparece quando há workflow ativo.
  check "GET /metrics reports an active workflow" metrics_report_active_workflow

  RESPONSE_FILE="$(mktemp)"
  trap 'rm -f "$RESPONSE_FILE"' EXIT

  HTTP_CODE="$(curl -s -o "$RESPONSE_FILE" -w '%{http_code}' -X POST "${BASE_URL}/webhook/iniciar" || true)"
  check "POST /webhook/iniciar returns 200" \
    test "$HTTP_CODE" = "200"
  check "response carries the execution summary" \
    node -e "
      const summary = JSON.parse(require('fs').readFileSync('$RESPONSE_FILE', 'utf-8'));
      if (typeof summary.executionTime !== 'string') throw new Error('missing executionTime');
      if (typeof summary.correlationId !== 'string') throw new Error('missing correlationId');
      if (!(summary.totalItemsProcessed > 0)) throw new Error('no items processed');
    "
fi

echo ""
echo "Resultado: ${GREEN}${PASS} passaram${NC}, ${RED}${FAIL} falharam${NC}"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
