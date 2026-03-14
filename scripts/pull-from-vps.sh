#!/usr/bin/env bash
# =============================================================================
# Script : Mettre à jour la version locale à partir du VPS
# (code, build .next, médias public/uploads, base MongoDB)
#
# Usage :
#   export SSHPASS='VOTRE_MOT_DE_PASSE'
#   export SSH_HOST=africamediaconnect.fr
#   ./scripts/pull-from-vps.sh
#
# Sans la base de données :
#   ./scripts/pull-from-vps.sh --no-db
# =============================================================================

set -e

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-africamediaconnect.fr}"
REMOTE_BASE="${REMOTE_BASE:-/root/social}"
REMOTE_APP="${REMOTE_BASE}/app"
REMOTE_UPLOADS="${REMOTE_BASE}/uploads"
DO_DB=true

for arg in "$@"; do
  case "$arg" in
    --no-db) DO_DB=false ;;
    -h|--help)
      echo "Usage: $0 [--no-db]"
      echo "  Récupère code, .next, uploads et base MongoDB depuis le VPS."
      echo "  --no-db : ne pas récupérer ni restaurer la base MongoDB"
      exit 0
      ;;
  esac
done

if [ -z "$SSH_HOST" ] || [ -z "$SSHPASS" ]; then
  echo "Usage: export SSHPASS='votre_mot_de_passe' SSH_HOST=africamediaconnect.fr && $0"
  exit 1
fi

export SSHPASS
RSYNC_SSH="sshpass -e ssh -o StrictHostKeyChecking=accept-new"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REMOTE="${SSH_USER}@${SSH_HOST}"

echo ">>> Récupération depuis ${REMOTE} vers $(basename "$PROJECT_ROOT")..."
echo ""

echo ">>> Sync code source (sans node_modules, .next, .git)..."
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'public/uploads' \
  --exclude '*.log' \
  -e "$RSYNC_SSH" \
  "${REMOTE}:${REMOTE_APP}/" "$PROJECT_ROOT/"

echo ">>> Sync dossier .next (build serveur)..."
rsync -avz \
  -e "$RSYNC_SSH" \
  "${REMOTE}:${REMOTE_APP}/.next/" "$PROJECT_ROOT/.next/"

echo ">>> Sync médias (uploads) depuis le serveur..."
mkdir -p "$PROJECT_ROOT/public/uploads"
rsync -avz \
  -e "$RSYNC_SSH" \
  "${REMOTE}:${REMOTE_UPLOADS}/" "$PROJECT_ROOT/public/uploads/" || true

if [ "$DO_DB" = true ]; then
  echo ""
  echo ">>> Récupération et restauration de la base MongoDB (socialhub)..."
  "$SCRIPT_DIR/fetch-db-from-vps.sh" --restore || {
    echo "  (Échec ou mongorestore absent - backup disponible dans backups/)"
  }
fi

echo ""
echo ">>> Mise à jour locale terminée."
echo "    Vous pouvez lancer: npm run dev"
