#!/usr/bin/env bash
# =============================================================================
# Flowgate Automation — Import the workflow into a running n8n instance
# =============================================================================
# Imports the workflow JSON, activates it and waits until the production webhook
# is registered. The n8n CLI exposes no single command for this: the id has to
# be resolved after the import, and activation only takes effect on the next
# boot, so a restart is part of the flow.
#
# Requires: `docker compose up -d` already running.
# Usage:    bash scripts/import-workflow.sh [path/to/workflow.json]
# =============================================================================

set -euo pipefail

WORKFLOW_FILE="${1:-workflows/workflow_user_sync.json}"
WORKFLOW_NAME="Flowgate Automation - User Sync Pipeline"
CONTAINER="${N8N_CONTAINER:-flowgate-n8n}"
HOST_PORT="${N8N_PORT:-5678}"
ACTIVATION_TIMEOUT="${N8N_ACTIVATION_TIMEOUT:-180}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

die() {
  echo -e "${RED}error: $*${NC}" >&2
  exit 1
}

# `docker inspect` exits 0 for a container that exists but is stopped, so it
# cannot answer "is it running?" on its own.
is_running() {
  [ "$(docker inspect --format '{{.State.Running}}' "$1" 2>/dev/null || echo false)" = "true" ]
}

[ -f "$WORKFLOW_FILE" ] || die "workflow file not found: $WORKFLOW_FILE"
is_running "$CONTAINER" || die "container $CONTAINER is not running (run 'make up' first)"

echo "==> Copying $WORKFLOW_FILE into the container"
docker cp "$WORKFLOW_FILE" "$CONTAINER:/tmp/flowgate-workflow.json" >/dev/null

echo "==> Importing"
docker compose exec -T n8n n8n import:workflow --input=/tmp/flowgate-workflow.json >/dev/null \
  || die "n8n import:workflow failed"

# The CLI prints its log lines to stdout, so the id is read from a JSON export
# instead of parsed out of `n8n list:workflow`.
echo "==> Resolving the workflow id"
docker compose exec -T n8n n8n export:workflow --all --output=/tmp/flowgate-export.json >/dev/null \
  || die "n8n export:workflow failed"

WORKFLOW_ID="$(docker compose exec -T n8n cat /tmp/flowgate-export.json 2>/dev/null | node -e '
  let raw = "";
  process.stdin.on("data", (chunk) => (raw += chunk));
  process.stdin.on("end", () => {
    let workflows;
    try {
      workflows = JSON.parse(raw);
    } catch {
      console.error("the workflow export is not valid JSON (is the container still starting?)");
      process.exit(2);
    }
    const match = workflows.find((w) => w.name === process.argv[1]);
    if (!match) {
      console.error(`no workflow named "${process.argv[1]}" in the export`);
      process.exit(1);
    }
    process.stdout.write(match.id);
  });
' "$WORKFLOW_NAME")" || die "could not resolve the id of \"$WORKFLOW_NAME\" after import"

echo "==> Activating workflow $WORKFLOW_ID"
docker compose exec -T n8n n8n update:workflow --id="$WORKFLOW_ID" --active=true >/dev/null \
  || die "n8n update:workflow failed"

# The command above only writes the flag to the database. n8n registers the
# webhooks on boot, so the activation is invisible until the next restart.
echo "==> Restarting n8n so the activation takes effect"
docker compose restart n8n >/dev/null

echo "==> Waiting for the production webhook to register"
DEADLINE=$((SECONDS + ACTIVATION_TIMEOUT))
while [ "$SECONDS" -lt "$DEADLINE" ]; do
  # A 404 means n8n is answering "webhook not registered" — not ready yet.
  # 000 means the port is not accepting connections because n8n is still booting.
  CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://localhost:${HOST_PORT}/webhook/iniciar" 2>/dev/null || true)"
  if [ "$CODE" != "404" ] && [ "$CODE" != "000" ]; then
    echo -e "${GREEN}==> Workflow active: POST /webhook/iniciar responds with HTTP $CODE${NC}"
    exit 0
  fi
  sleep 3
done

die "the webhook did not register within ${ACTIVATION_TIMEOUT}s"
