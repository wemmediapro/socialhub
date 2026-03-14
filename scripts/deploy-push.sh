#!/usr/bin/env bash
# =============================================================================
# Script : Déployer l'application Social Hub sur le serveur (après deploy-server-setup.sh)
# Prérequis : Node.js 18+ et MongoDB sur le serveur (ou MONGODB_URI distant)
# Usage :
#   export SSHPASS='VOTRE_MOT_DE_PASSE'
#   ./scripts/deploy-push.sh
# =============================================================================

set -e

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-187.77.168.205}"
REMOTE_BASE="${REMOTE_BASE:-/root/social}"
REMOTE_APP="${REMOTE_BASE}/app"
REMOTE_UPLOADS="${REMOTE_BASE}/uploads"

if [ -n "$SSHPASS" ]; then
  export SSHPASS
  SCP_CMD="sshpass -e scp -o StrictHostKeyChecking=accept-new"
  SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new"
elif [ -n "$1" ]; then
  export SSHPASS="$1"
  SCP_CMD="sshpass -e scp -o StrictHostKeyChecking=accept-new"
  SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new"
else
  echo "Usage: export SSHPASS='votre_mot_de_passe' && $0"
  exit 1
fi

REMOTE="${SSH_USER}@${SSH_HOST}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ">>> Build Next.js local..."
cd "$PROJECT_ROOT"
npm run build

echo ">>> Sync application (sans node_modules) vers ${REMOTE}:${REMOTE_APP}..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'public/uploads' \
  --exclude '*.log' \
  -e "sshpass -e ssh -o StrictHostKeyChecking=accept-new" \
  "$PROJECT_ROOT/" "${REMOTE}:${REMOTE_APP}/"

echo ">>> Sync dossier .next (build)..."
rsync -avz \
  -e "sshpass -e ssh -o StrictHostKeyChecking=accept-new" \
  "$PROJECT_ROOT/.next/" "${REMOTE}:${REMOTE_APP}/.next/"

echo ">>> Sync médias (public/uploads) vers ${REMOTE}:${REMOTE_UPLOADS}..."
if [ -d "$PROJECT_ROOT/public/uploads" ]; then
  rsync -avz \
    -e "sshpass -e ssh -o StrictHostKeyChecking=accept-new" \
    "$PROJECT_ROOT/public/uploads/" "${REMOTE}:${REMOTE_UPLOADS}/" || true
else
  echo "    (aucun dossier public/uploads local, ignoré)"
fi

echo ">>> Sur le serveur : npm install --production et redémarrage..."
$SSH_CMD "$REMOTE" bash -s -- "$REMOTE_APP" "$REMOTE_UPLOADS" "$REMOTE_BASE" << 'REMOTE_SCRIPT'
set -e
APP="$1"
UPLOADS="$2"
BASE="$3"
cd "$APP"
npm install --production
# Lier les uploads si l'app utilise public/uploads en relatif
if [ ! -d "$APP/public/uploads" ]; then
  mkdir -p "$APP/public"
  ln -sfn "$UPLOADS" "$APP/public/uploads" 2>/dev/null || true
fi
echo "Pour lancer en production (une fois .env et MongoDB configurés):"
echo "  cd $APP && LOCAL_UPLOAD_DIR=$UPLOADS npm start"
echo "Ou avec pm2: pm2 start npm --name socialhub -- start"
REMOTE_SCRIPT

echo ""
echo ">>> Déploiement terminé. Pensez à :"
echo "  1. Copier/créer .env sur le serveur ($REMOTE_APP/.env)"
echo "  2. MONGODB_URI et LOCAL_UPLOAD_DIR=$REMOTE_UPLOADS"
echo "  3. Lancer l'app (npm start ou pm2)"
