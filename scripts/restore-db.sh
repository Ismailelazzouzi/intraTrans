#!/bin/bash
# Restore PostgreSQL from backup
set -euo pipefail

BACKUP_FILE="${1:?Usage: ./scripts/restore-db.sh <backup_file.sql.gz>}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ File not found: $BACKUP_FILE"
  exit 1
fi

# Source environment variables if .env exists to get correct database credentials
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

echo "⚠️  This will REPLACE all data in the database. Press Ctrl+C to cancel."
for i in {5..1}; do
    echo -ne "Continuing in $i seconds...\r"
    sleep 1
done
echo ""

echo "⏳ Restoring database..."
gunzip -c "$BACKUP_FILE" | docker exec -i database psql -U "${POSTGRES_USER:-transcendence}" "${POSTGRES_DB:-transcendence_db}" > /dev/null

echo "✅ Database restored successfully from: $BACKUP_FILE"
