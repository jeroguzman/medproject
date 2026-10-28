#!/usr/bin/env bash
# Called with the deployment lock held by the workflow. Never loads secrets as shell code.
set -euo pipefail
cd "$(dirname "$0")/.."
target="${1:?Indica el SHA probado}"
[[ "$target" =~ ^[a-f0-9]{40}$ ]]
[ "$(git rev-parse HEAD)" = "$target" ]
test -f .env.production
export APP_IMAGE_TAG="$target"
compose=(docker compose --env-file .env.production -f compose.production.yaml)
"${compose[@]}" config --quiet
# Build before touching running services. Keep old images for manual recovery.
"${compose[@]}" build
bash scripts/backup-production.sh
"${compose[@]}" up -d --wait --wait-timeout 180
"${compose[@]}" exec -T backend python manage.py check --deploy
curl --fail --show-error --silent --retry 5 --retry-delay 3 https://medvox.tech/healthz
printf '\nDesplegado: %s\n' "$target"
