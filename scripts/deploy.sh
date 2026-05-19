#!/usr/bin/env bash
set -euo pipefail
echo "==> Deploying Tueban Worker..."
wrangler deploy
echo "==> Deploying Tueban Pages..."
npx wrangler pages deploy apps/web/public --project-name=tueban-web
echo "==> Done"
