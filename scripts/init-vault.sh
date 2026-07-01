#!/bin/sh
# Populate Vault KV with application secrets from .env.
# Run this ONCE after `docker compose -f devops/compose/docker-compose.prod.yml up vault -d`.
#
# Usage: ./scripts/init-vault.sh

set -e

ENV_FILE="$(dirname "$0")/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Load .env values into shell
set -a
. "$ENV_FILE"
set +a

# Default to localhost for host usage; override with VAULT_ADDR env var for Docker
VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"

echo "[*] Waiting for Vault to be ready at $VAULT_ADDR..."
until wget -qO- "${VAULT_ADDR}/v1/sys/health" > /dev/null 2>&1; do
  sleep 2
done
echo "[*] Vault is ready."

echo "[*] Writing secrets to secret/hive..."
SECRET_FILE=$(mktemp)
chmod 600 "$SECRET_FILE"
printf '{
  "data": {
    "DATABASE_URL":        "%s",
    "JWT_SECRET":          "%s",
    "REFRESH_SECRET":      "%s",
    "GOOGLE_CLIENT_ID":    "%s",
    "GOOGLE_CLIENT_SECRET":"%s",
    "FRONTEND_URL":        "%s",
    "METRICS_SECRET":      "%s"
  }
}' \
  "$DATABASE_URL" "$JWT_SECRET" "$REFRESH_SECRET" \
  "$GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_SECRET" \
  "$FRONTEND_URL" "$METRICS_SECRET" > "$SECRET_FILE"

wget -qO- \
  --header="X-Vault-Token: ${VAULT_TOKEN}" \
  --header="Content-Type: application/json" \
  --post-file="$SECRET_FILE" \
  "${VAULT_ADDR}/v1/secret/data/hive" > /dev/null

rm -f "$SECRET_FILE"

echo ""
echo "[OK] Secrets written to Vault at secret/hive"
echo "     You can now start the full stack: make build-prod"
