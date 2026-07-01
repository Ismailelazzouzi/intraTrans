#!/bin/sh
# Vault production init/unseal/populate script.
# Runs as a one-shot service on every stack start.
#   - First boot  : initializes Vault, saves keys, unseals, enables KV, writes secrets.
#   - Later boots  : detects already initialized, reads stored unseal key, unseals, done.
# Keys are stored in the vault-keys named volume at /vault/keys/init.json.
# IMPORTANT: back up that file — losing it means you cannot unseal Vault after a restart.

set -e

KEYS_FILE="/vault/keys/init.json"
TOKEN_FILE="/vault/keys/vault-token"
# /vault/file is the data path used by the vault server (entrypoint auto-chowns it)
VAULT_ADDR="${VAULT_ADDR:-http://vault:8200}"

echo "[*] Waiting for Vault to respond..."
until wget -qO- "${VAULT_ADDR}/v1/sys/health?standbyok=true&uninitcode=200&sealedcode=200" >/dev/null 2>&1; do
  sleep 2
done
echo "[*] Vault is reachable."

# ── Initialize on first boot ──────────────────────────────────────────────────
INIT_STATUS=$(wget -qO- "${VAULT_ADDR}/v1/sys/init" 2>/dev/null)
if echo "$INIT_STATUS" | grep -q '"initialized":false'; then
  echo "[*] First boot — initializing Vault (1 key share, threshold 1)..."
  mkdir -p "$(dirname "$KEYS_FILE")"

  PAYLOAD_FILE=$(mktemp); chmod 600 "$PAYLOAD_FILE"
  printf '{"secret_shares":1,"secret_threshold":1}' > "$PAYLOAD_FILE"
  INIT_RESULT=$(wget -qO- \
    --header="Content-Type: application/json" \
    --post-file="$PAYLOAD_FILE" \
    "${VAULT_ADDR}/v1/sys/init")
  rm -f "$PAYLOAD_FILE"

  printf '%s' "$INIT_RESULT" > "$KEYS_FILE"
  chmod 600 "$KEYS_FILE"
  echo "[OK] Vault initialized."
  echo "     IMPORTANT: back up $KEYS_FILE — it is your only recovery key."
fi

# ── Unseal if needed ──────────────────────────────────────────────────────────
HEALTH=$(wget -qO- "${VAULT_ADDR}/v1/sys/health?uninitcode=200&sealedcode=200" 2>/dev/null || true)
if echo "$HEALTH" | grep -q '"sealed":true'; then
  echo "[*] Vault is sealed — unsealing..."

  if [ ! -f "$KEYS_FILE" ]; then
    echo "ERROR: $KEYS_FILE not found. Cannot unseal automatically."
    echo "       Provide the unseal key and run: vault operator unseal <key>"
    exit 1
  fi

  UNSEAL_KEY=$(sed 's/.*"keys_base64":\["\([^"]*\)"\].*/\1/' "$KEYS_FILE")

  PAYLOAD_FILE=$(mktemp); chmod 600 "$PAYLOAD_FILE"
  printf '{"key":"%s"}' "$UNSEAL_KEY" > "$PAYLOAD_FILE"
  wget -qO- \
    --header="Content-Type: application/json" \
    --post-file="$PAYLOAD_FILE" \
    "${VAULT_ADDR}/v1/sys/unseal" >/dev/null
  rm -f "$PAYLOAD_FILE"
  echo "[OK] Vault unsealed."
fi

# ── Extract root token and share with backend ─────────────────────────────────
ROOT_TOKEN=$(sed 's/.*"root_token":"\([^"]*\)".*/\1/' "$KEYS_FILE")
printf '%s' "$ROOT_TOKEN" > "$TOKEN_FILE"
chmod 644 "$TOKEN_FILE"

# ── Enable KV v2 if not already mounted ──────────────────────────────────────
KV_CHECK=$(wget -qO- \
  --header="X-Vault-Token: ${ROOT_TOKEN}" \
  "${VAULT_ADDR}/v1/sys/mounts" 2>/dev/null || echo '{}')
if ! echo "$KV_CHECK" | grep -q '"secret/"'; then
  echo "[*] Enabling KV v2 secret engine at secret/..."
  PAYLOAD_FILE=$(mktemp); chmod 600 "$PAYLOAD_FILE"
  printf '{"type":"kv","options":{"version":"2"}}' > "$PAYLOAD_FILE"
  wget -qO- \
    --header="X-Vault-Token: ${ROOT_TOKEN}" \
    --header="Content-Type: application/json" \
    --post-file="$PAYLOAD_FILE" \
    "${VAULT_ADDR}/v1/sys/mounts/secret" >/dev/null
  rm -f "$PAYLOAD_FILE"
  echo "[OK] KV v2 enabled."
fi

# ── Write application secrets ─────────────────────────────────────────────────
echo "[*] Writing secrets to secret/hive..."
SECRET_FILE=$(mktemp); chmod 600 "$SECRET_FILE"
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
  --header="X-Vault-Token: ${ROOT_TOKEN}" \
  --header="Content-Type: application/json" \
  --post-file="$SECRET_FILE" \
  "${VAULT_ADDR}/v1/secret/data/hive" >/dev/null
rm -f "$SECRET_FILE"

echo "[OK] Secrets written to Vault. Stack is ready."
