#!/usr/bin/env bash
# =============================================================================
# 1) Installe et démarre MongoDB sur le VPS
# 2) Exporte la base locale socialhub (mongodump)
# 3) Transfère le dump sur le VPS
# 4) Restaure la base sur le VPS (mongorestore)
#
# Prérequis : MongoDB installé en local, base socialhub existante.
#
# Usage :
#   export SSHPASS='VOTRE_MOT_DE_PASSE'
#   ./scripts/mongo-install-and-migrate.sh
# =============================================================================

set -e

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-31.97.199.38}"
REMOTE_BASE="${REMOTE_BASE:-/root/social}"
DUMP_DIR_NAME="socialhub-dump"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -z "$SSHPASS" ]; then
  echo "Usage: export SSHPASS='votre_mot_de_passe' && $0"
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ConnectTimeout=30"
SSH_CMD="sshpass -e ssh $SSH_OPTS"
REMOTE="${SSH_USER}@${SSH_HOST}"
export SSHPASS

# URI locale
if [ -f "$PROJECT_ROOT/.env" ]; then
  MONGODB_URI_LOCAL=$(grep -E '^MONGODB_URI=' "$PROJECT_ROOT/.env" | cut -d= -f2- | tr -d '\r' | head -1)
fi
MONGODB_URI_LOCAL="${MONGODB_URI_LOCAL:-mongodb://localhost:27017/socialhub}"

echo "=============================================="
echo "  MongoDB sur le VPS + migration de la base"
echo "  Serveur: ${REMOTE}"
echo "  Base locale: ${MONGODB_URI_LOCAL}"
echo "=============================================="
echo ""
echo "  Assurez-vous que MongoDB tourne en local (ex: brew services start mongodb-community)."
echo ""

# -----------------------------------------------------------------------------
# Étape 1 : Installer et démarrer MongoDB sur le VPS
# -----------------------------------------------------------------------------
echo ""
echo ">>> Étape 1/4 : Installation et démarrage de MongoDB sur le VPS..."

$SSH_CMD "$REMOTE" bash -s << 'REMOTE_INSTALL'
set -e
export DEBIAN_FRONTEND=noninteractive
if ! command -v apt-get &>/dev/null; then
  echo "Erreur: Debian/Ubuntu requis (apt-get)."
  exit 1
fi
if command -v mongod &>/dev/null; then
  echo "  MongoDB déjà installé."
  systemctl start mongod 2>/dev/null || true
  systemctl enable mongod 2>/dev/null || true
  echo "  Service démarré."
  exit 0
fi
# Nettoyer un ancien repo qui pointerait vers noble (non supporté)
rm -f /etc/apt/sources.list.d/mongodb-org-7.0.list 2>/dev/null || true
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg
CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
# Ubuntu 24.04 noble n'a pas de repo MongoDB 7 -> utiliser jammy
[ "$CODENAME" = "noble" ] && CODENAME="jammy"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --batch --yes -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${CODENAME}/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update -qq
apt-get install -y -qq mongodb-org
mkdir -p /data/db
chown -R mongodb:mongodb /data/db 2>/dev/null || true
systemctl start mongod
systemctl enable mongod
echo "  MongoDB installé et démarré."
REMOTE_INSTALL

# -----------------------------------------------------------------------------
# Étape 2 : Dump de la base locale
# -----------------------------------------------------------------------------
echo ""
echo ">>> Étape 2/4 : Export de la base locale (mongodump)..."

DUMP_LOCAL="$PROJECT_ROOT/$DUMP_DIR_NAME"
rm -rf "$DUMP_LOCAL"
mkdir -p "$DUMP_LOCAL"

if ! command -v mongodump &>/dev/null; then
  echo "  mongodump introuvable en local. Installez mongodb-database-tools (ou MongoDB)."
  echo "  macOS: brew install mongodb-database-tools"
  exit 1
fi

if mongodump --uri="$MONGODB_URI_LOCAL" --out="$DUMP_LOCAL" 2>/dev/null; then
  echo "  Dump créé : $DUMP_LOCAL"
else
  echo "  Échec du dump. Vérifiez que MongoDB tourne en local et que la base socialhub existe."
  echo "  Lancez: mongod"
  exit 1
fi

# -----------------------------------------------------------------------------
# Étape 3 : Transfert du dump vers le VPS
# -----------------------------------------------------------------------------
echo ""
echo ">>> Étape 3/4 : Transfert du dump vers le VPS..."

$SSH_CMD "$REMOTE" "mkdir -p $REMOTE_BASE"
rsync -az -e "sshpass -e ssh $SSH_OPTS" "$DUMP_LOCAL/" "${REMOTE}:${REMOTE_BASE}/${DUMP_DIR_NAME}/"
echo "  Dump transféré vers ${REMOTE}:${REMOTE_BASE}/${DUMP_DIR_NAME}/"

# -----------------------------------------------------------------------------
# Étape 4 : Restauration sur le VPS
# -----------------------------------------------------------------------------
echo ""
echo ">>> Étape 4/4 : Restauration sur le VPS (mongorestore)..."

$SSH_CMD "$REMOTE" bash -s -- "$REMOTE_BASE" "$DUMP_DIR_NAME" << 'REMOTE_RESTORE'
set -e
BASE="$1"
DUMP_NAME="$2"
DUMP_PATH="$BASE/$DUMP_NAME"
if [ ! -d "$DUMP_PATH/socialhub" ]; then
  echo "  Dossier $DUMP_PATH/socialhub introuvable."
  exit 1
fi
if command -v mongorestore &>/dev/null; then
  mongorestore --db=socialhub "$DUMP_PATH/socialhub" --drop
  echo "  Base socialhub restaurée."
else
  echo "  mongorestore introuvable. Installation des outils MongoDB..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq mongodb-mongosh 2>/dev/null || true
  # mongorestore fait partie de mongodb-org-tools
  apt-get install -y -qq mongodb-org-tools 2>/dev/null || apt-get install -y -qq mongodb-org 2>/dev/null || true
  if command -v mongorestore &>/dev/null; then
    mongorestore --db=socialhub "$DUMP_PATH/socialhub" --drop
    echo "  Base socialhub restaurée."
  else
    echo "  Échec: mongorestore non disponible. Installez mongodb-org-tools sur le VPS."
    exit 1
  fi
fi
rm -rf "$DUMP_PATH" 2>/dev/null || true
echo "  Dump temporaire supprimé sur le serveur."
REMOTE_RESTORE

# Nettoyage local
rm -rf "$DUMP_LOCAL"
echo ""
echo "=============================================="
echo "  Terminé. MongoDB est installé sur le VPS et"
echo "  la base socialhub a été restaurée."
echo "  Redémarrer l'app si besoin: ssh ... 'pm2 restart socialhub --update-env'"
echo "=============================================="
