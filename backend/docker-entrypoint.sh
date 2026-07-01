#!/bin/sh
set -e

# In production, vault-prod-init writes the root token here after unsealing.
# This overrides any VAULT_TOKEN value from the env file.
if [ -f "/vault/keys/vault-token" ]; then
  VAULT_TOKEN=$(cat /vault/keys/vault-token)
  export VAULT_TOKEN
fi

echo "Running DB Migrations..."
if [ -d "prisma/migrations" ]; then
    npx prisma migrate deploy
else
    npx prisma db push --accept-data-loss
fi

echo "Starting Backend..."
exec node dist/server.js
