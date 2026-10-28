#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
mkdir -p backups
backup_file="backups/medvox-$(date -u +%Y%m%dT%H%M%SZ)-$$.dump"
temporary="$(mktemp backups/.pending.XXXXXX)"
trap 'rm -f "$temporary"' EXIT
docker compose --env-file .env.production -f compose.production.yaml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "$temporary"
test -s "$temporary"
mv "$temporary" "$backup_file"
printf 'Backup creado: %s\n' "$backup_file"
