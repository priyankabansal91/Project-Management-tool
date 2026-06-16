#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="claude/saas-project-management-design-BsbSY"

echo "=== Q-Flow Deploy: $(date) ==="
cd "$REPO_DIR"

# Pull latest code
git fetch origin
git reset --hard origin/$BRANCH
echo "✓ Code updated"

# ── Backend ──────────────────────────────────────────────
cd "$REPO_DIR/backend"

# Copy .env if it exists one level up (set once on the server, never committed)
[ -f "$REPO_DIR/.env" ] && cp "$REPO_DIR/.env" .env

npm install --omit=dev
npx prisma migrate deploy
echo "✓ DB migrations applied"

# Start or restart with PM2
if pm2 show qflow-backend > /dev/null 2>&1; then
  pm2 reload qflow-backend --update-env
else
  pm2 start src/app.js --name qflow-backend --env production
fi
pm2 save
echo "✓ Backend restarted"

# ── Frontend ─────────────────────────────────────────────
cd "$REPO_DIR/frontend"
npm install
npm run build
echo "✓ Frontend built"

# Deploy built files — nginx root (adjust path if needed)
NGINX_ROOT="/var/www/html"
if [ -w "$NGINX_ROOT" ]; then
  rm -rf "$NGINX_ROOT"/*
  cp -r dist/* "$NGINX_ROOT/"
  echo "✓ Frontend deployed to $NGINX_ROOT"
else
  echo "⚠ Cannot write to $NGINX_ROOT — run: sudo cp -r $REPO_DIR/frontend/dist/* $NGINX_ROOT/"
fi

echo "=== Deploy complete ==="
