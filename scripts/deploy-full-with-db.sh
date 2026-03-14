#!/usr/bin/env bash
# =============================================================================
# Déploiement complet : application + médias + base de données
# Accède au serveur SSH, met à jour les fichiers de l'app, les médias et la BDD
# à partir de la version locale.
#
# Usage :
#   export SSHPASS='VOTRE_MOT_DE_PASSE'
#   ./scripts/deploy-full-with-db.sh
#   ou: ./scripts/deploy-full-with-db.sh 'VOTRE_MOT_DE_PASSE'
# =============================================================================

set -e

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-187.77.168.205}"
REMOTE_BASE="${REMOTE_BASE:-/root/social}"
REMOTE_APP="${REMOTE_BASE}/app"
REMOTE_UPLOADS="${REMOTE_BASE}/uploads"
REMOTE_DATA="${REMOTE_BASE}/data"
MONGO_DB="${MONGO_DATABASE:-socialhub}"
MONGO_URI_LOCAL="${MONGODB_URI:-mongodb://127.0.0.1:27017}"

if [ -n "$SSHPASS" ]; then
  export SSHPASS
  SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new"
elif [ -n "$1" ]; then
  export SSHPASS="$1"
  SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new"
else
  echo "Usage: export SSHPASS='votre_mot_de_passe' && $0"
  echo "   ou: $0 'votre_mot_de_passe'"
  exit 1
fi

REMOTE="${SSH_USER}@${SSH_HOST}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TMP_DUMP="$PROJECT_ROOT/.tmp_db_dump_$$"

cleanup_dump() {
  rm -rf "$TMP_DUMP"
}
trap cleanup_dump EXIT

echo "=============================================="
echo "  Déploiement complet (app + médias + BDD)"
echo "  Serveur: ${REMOTE}"
echo "  Dossier: ${REMOTE_BASE}"
echo "=============================================="

# -----------------------------------------------------------------------------
# Export local MongoDB (si mongodump dispo et MongoDB local actif)
# -----------------------------------------------------------------------------
DO_RESTORE_DB=""
if command -v mongodump &>/dev/null; then
  echo ""
  echo ">>> Export de la base de données locale (${MONGO_DB})..."
  if mongodump --uri="${MONGO_URI_LOCAL}" --db="${MONGO_DB}" --out="$TMP_DUMP" 2>/dev/null; then
    echo "  Export BDD local OK."
    DO_RESTORE_DB="1"
  else
    echo "  (MongoDB local injoignable ou erreur - déploiement app/médias uniquement)"
    rm -rf "$TMP_DUMP"
  fi
else
  echo ""
  echo "  (mongodump absent - déploiement app + médias uniquement, BDD non mise à jour)"
fi

# -----------------------------------------------------------------------------
# Lancer le déploiement application + médias (deploy-full.sh)
# -----------------------------------------------------------------------------
echo ""
"$SCRIPT_DIR/deploy-full.sh"

# -----------------------------------------------------------------------------
# Restauration de la BDD sur le serveur (si export local a réussi)
# -----------------------------------------------------------------------------
if [ -n "$DO_RESTORE_DB" ] && [ -d "$TMP_DUMP" ] && [ -d "$TMP_DUMP/$MONGO_DB" ]; then
  echo ""
  echo ">>> Envoi et restauration de la base de données sur le serveur..."
  $SSH_CMD "$REMOTE" "mkdir -p $REMOTE_DATA"
  rsync -az --delete \
    -e "sshpass -e ssh -o StrictHostKeyChecking=accept-new" \
    "$TMP_DUMP/" "${REMOTE}:${REMOTE_DATA}/db_dump/"
  echo "  Restauration mongorestore sur le serveur..."
  $SSH_CMD "$REMOTE" "mongorestore --uri=mongodb://127.0.0.1:27017 --db=$MONGO_DB --drop ${REMOTE_DATA}/db_dump && rm -rf ${REMOTE_DATA}/db_dump"
  echo "  Base de données mise à jour sur le serveur."
fi

echo ""
echo "=============================================="
echo "  Mise à jour terminée."
echo "  URL: http://${SSH_HOST}:3000"
echo "  Sur le serveur: pm2 status | pm2 logs socialhub"
echo "=============================================="
