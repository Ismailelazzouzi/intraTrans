#!/bin/bash
# Automated PostgreSQL backup for The Hive
set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/hive_db_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Source environment variables if .env exists to get correct database credentials
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

echo "⏳ Starting database backup..."

# Dump the database from the running container, compress it
docker exec database pg_dump -U "${POSTGRES_USER:-transcendence}" "${POSTGRES_DB:-transcendence_db}" \
  | gzip > "$BACKUP_FILE"

echo "✅ Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Keep only last 7 backups (rotate old ones)
ls -t "${BACKUP_DIR}"/hive_db_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm
echo "🗑️  Old backups rotated (keeping last 7)"
