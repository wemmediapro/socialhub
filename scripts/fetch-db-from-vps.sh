#!/usr/bin/env bash
# =============================================================================
# Récupère la base MongoDB (socialhub) depuis le VPS vers la machine locale.
# 1) Sur le VPS : mongodump
# 2) Transfert du dump vers local (backups/)
# 3) Optionnel : restauration en local (mongorestore)
#
# Usage :
#   export SSHPASS='VOTRE_MOT_DE_PASSE'
#   ./scripts/fetch-db-from-vps.sh
#
# Avec restauration automatique en local après téléchargement :
#   ./scripts/fetch-db-from-vps.sh --restore
# =============================================================================

set -e

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-31.97.199.38}"
REMOTE_BASE="${REMOTE_BASE:-/root/social}"
MONGO_DB="${MONGO_DATABASE:-socialhub}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
DO_RESTORE=false

for arg in "$@"; do
  case "$arg" in
    --restore) DO_RESTORE=true ;;
    -h|--help)
      echo "Usage: $0 [--restore]"
      echo "  Sans option : télécharge le dump du VPS vers backups/"
      echo "  --restore   : après téléchargement, restaure la base en local (MONGODB_URI)"
      exit 0
      ;;
  esac
done

if [ -z "$SSHPASS" ]; then
  echo "Usage: export SSHPASS='votre_mot_de_passe' && $0 [--restore]"
  echo "  Exemple: export SSHPASS='Testmediapro2026@' && $0 --restore"
  exit 1
fi

export SSHPASS
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ConnectTimeout=30"
SSH_CMD="sshpass -e ssh $SSH_OPTS"
SCP_CMD="sshpass -e scp $SSH_OPTS"
REMOTE="${SSH_USER}@${SSH_HOST}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REMOTE_DUMP="/tmp/socialhub-fetch-$$"
REMOTE_TAR="/tmp/socialhub-dump-${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "=============================================="
echo "  Récupération de la base depuis le VPS"
echo "  Serveur: ${REMOTE}"
echo "  Base: ${MONGO_DB}"
echo "  Destination locale: ${BACKUP_DIR}"
echo "=============================================="

# -----------------------------------------------------------------------------
# 1) Sur le VPS : mongodump puis compression
# -----------------------------------------------------------------------------
echo ""
echo ">>> Étape 1/3 : Export MongoDB sur le VPS (mongodump)..."
$SSH_CMD "$REMOTE" bash -s -- "$REMOTE_DUMP" "$REMOTE_TAR" "$MONGO_DB" << 'REMOTE_SCRIPT'
set -e
DUMP_PATH="$1"
TAR_PATH="$2"
DB_NAME="$3"
rm -rf "$DUMP_PATH"
mkdir -p "$DUMP_PATH"
if command -v mongodump &>/dev/null; then
  mongodump --uri="mongodb://127.0.0.1:27017/${DB_NAME}" --out="$DUMP_PATH" 2>/dev/null || \
  mongodump --db="$DB_NAME" --out="$DUMP_PATH" 2>/dev/null || {
    echo "  Échec mongodump. Vérifiez que MongoDB tourne sur le VPS (systemctl status mongod)."
    exit 1
  }
else
  echo "  mongodump introuvable sur le VPS. Installez mongodb-database-tools."
  exit 1
fi
cd "$(dirname "$DUMP_PATH")"
tar -czf "$TAR_PATH" "$(basename "$DUMP_PATH")"
rm -rf "$DUMP_PATH"
echo "  Dump créé: $TAR_PATH"
REMOTE_SCRIPT

# -----------------------------------------------------------------------------
# 2) Transfert du fichier vers la machine locale
# -----------------------------------------------------------------------------
echo ""
echo ">>> Étape 2/3 : Transfert vers ${BACKUP_DIR}..."
LOCAL_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"
$SCP_CMD "$REMOTE:$REMOTE_TAR" "$LOCAL_FILE"
$SSH_CMD "$REMOTE" "rm -f $REMOTE_TAR"
echo "  Fichier récupéré: $LOCAL_FILE"

# -----------------------------------------------------------------------------
# 3) Optionnel : restauration en local
# -----------------------------------------------------------------------------
if [ "$DO_RESTORE" = true ]; then
  echo ""
  echo ">>> Étape 3/3 : Restauration en local..."
  if [ -f "$PROJECT_ROOT/import-mongodb.sh" ]; then
    "$PROJECT_ROOT/import-mongodb.sh" "$LOCAL_FILE"
  elif command -v mongorestore &>/dev/null; then
    TMPDIR=$(mktemp -d)
    trap "rm -rf $TMPDIR" EXIT
    tar -xzf "$LOCAL_FILE" -C "$TMPDIR"
    MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017}"
    if [ -f "$PROJECT_ROOT/.env" ]; then
      MONGO_URI=$(grep -E '^MONGODB_URI=' "$PROJECT_ROOT/.env" | cut -d= -f2- | tr -d '\r' | head -1)
    fi
    RESTORE_DIR=$(find "$TMPDIR" -maxdepth 2 -type d -name "$MONGO_DB" 2>/dev/null | head -1)
    [ -z "$RESTORE_DIR" ] && RESTORE_DIR=$(ls -d "$TMPDIR"/*/ 2>/dev/null | head -1)
    [ -z "$RESTORE_DIR" ] && RESTORE_DIR="$TMPDIR"
    mongorestore --uri="$MONGO_URI" --db="$MONGO_DB" --drop "$RESTORE_DIR"
    echo "  Base restaurée en local."
  else
    echo "  mongorestore introuvable. Installez MongoDB Database Tools ou lancez: ./import-mongodb.sh $LOCAL_FILE"
  fi
else
  echo ""
  echo ">>> Étape 3/3 : (ignorée, pas de --restore)"
  echo "  Pour restaurer en local : ./import-mongodb.sh $LOCAL_FILE"
fi

echo ""
echo "=============================================="
echo "  Récupération terminée."
echo "  Backup local : $LOCAL_FILE"
echo "=============================================="
