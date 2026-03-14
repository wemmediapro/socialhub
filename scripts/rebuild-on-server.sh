#!/usr/bin/env bash
# Rebuild Next.js sur le VPS puis redémarre PM2 (corrige MODULE_NOT_FOUND / 500).
# Usage: SSHPASS='...' SSH_HOST=africamediaconnect.fr ./scripts/rebuild-on-server.sh
set -e
SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-}"
REMOTE_APP="${REMOTE_APP:-/root/social/app}"
if [ -z "$SSH_HOST" ]; then echo "Définissez SSH_HOST"; exit 1; fi
if [ -n "$SSHPASS" ]; then export SSHPASS; SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new"; else SSH_CMD="ssh -o StrictHostKeyChecking=accept-new"; fi
echo ">>> Rebuild sur le serveur (peut prendre 1–2 min)..."
$SSH_CMD "$SSH_USER@$SSH_HOST" "cd $REMOTE_APP && npm run build && pm2 restart socialhub"
echo ">>> Terminé. Réessayez le site."
