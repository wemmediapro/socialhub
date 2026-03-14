#!/usr/bin/env bash
# =============================================================================
# Hébergement Social Hub via Docker (alternative à pm2)
# - Envoie le projet sur le serveur dans /root/social
# - Lance docker compose (app Next.js + MongoDB) sur le port 3100
#
# Usage : export SSHPASS='MOT_DE_PASSE' && ./scripts/deploy-docker.sh
# =============================================================================

set -e

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-187.77.168.205}"
REMOTE_BASE="${REMOTE_BASE:-/root/social}"

if [ -n "$SSHPASS" ]; then
  export SSHPASS
  SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new"
elif [ -n "$1" ]; then
  export SSHPASS="$1"
  SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new"
else
  echo "Usage: export SSHPASS='votre_mot_de_passe' && $0"
  exit 1
fi

REMOTE="${SSH_USER}@${SSH_HOST}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=============================================="
echo "  Social Hub – Déploiement Docker"
echo "  Serveur: ${REMOTE}"
echo "  Dossier: ${REMOTE_BASE}"
echo "  Port: 3100 (app + MongoDB dans Docker)"
echo "=============================================="

echo ""
echo ">>> Création du dossier et envoi du projet..."

$SSH_CMD "$REMOTE" "mkdir -p $REMOTE_BASE"

echo ">>> Nettoyage des anciens dossiers (app, uploads, data) pour éviter conflit rsync..."
$SSH_CMD "$REMOTE" "rm -rf ${REMOTE_BASE}/app ${REMOTE_BASE}/uploads ${REMOTE_BASE}/data 2>/dev/null; true"

rsync -az --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.log' \
  -e "sshpass -e ssh -o StrictHostKeyChecking=accept-new" \
  "$PROJECT_ROOT/" "${REMOTE}:${REMOTE_BASE}/"

echo ">>> Envoi des médias (public/uploads)..."
if [ -d "$PROJECT_ROOT/public/uploads" ]; then
  $SSH_CMD "$REMOTE" "mkdir -p $REMOTE_BASE/public/uploads"
  rsync -az \
    -e "sshpass -e ssh -o StrictHostKeyChecking=accept-new" \
    "$PROJECT_ROOT/public/uploads/" "${REMOTE}:${REMOTE_BASE}/public/uploads/" || true
fi

echo ""
echo ">>> Sur le serveur : docker compose up -d --build..."

$SSH_CMD "$REMOTE" bash -s -- "$REMOTE_BASE" << 'REMOTE_SCRIPT'
set -e
BASE="$1"
cd "$BASE"

if ! command -v docker &>/dev/null; then
  echo "Docker non installé. Installation..."
  curl -fsSL https://get.docker.com | sh
  systemctl start docker
  systemctl enable docker
fi

docker compose up -d --build

echo ""
echo "Containers:"
docker compose ps
REMOTE_SCRIPT

echo ""
echo "=============================================="
echo "  Déploiement Docker terminé."
echo "  URL : http://${SSH_HOST}:3100"
echo "  Sur le serveur : cd ${REMOTE_BASE} && docker compose logs -f"
echo "=============================================="
