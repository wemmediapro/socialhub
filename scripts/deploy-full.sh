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
# URI locale (depuis .env ou défaut)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$PROJECT_ROOT/.env" ]; then
  MONGODB_URI_LOCAL="${MONGODB_URI:-}"
  [ -z "$MONGODB_URI_LOCAL" ] && MONGODB_URI_LOCAL=$(grep -E '^MONGODB_URI=' "$PROJECT_ROOT/.env" | cut -d= -f2- | tr -d '\r')
fi
MONGODB_URI_LOCAL="${MONGODB_URI_LOCAL:-mongodb://localhost:27017/socialhub}"

if [ -z "$SSHPASS" ]; then
  echo "Usage: export SSHPASS='votre_mot_de_passe' && $0"
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ConnectTimeout=30"
REMOTE="${SSH_USER}@${SSH_HOST}"
export SSHPASS

echo "=============================================="
echo "  MongoDB sur le VPS + migration de la base"
echo "  Serveur: ${REMOTE}"
echo "  Base locale: ${MONGODB_URI_LOCAL}"
echo "=============================================="

# -----------------------------------------------------------------------------
# Étape 1 : Installer et démarrer MongoDB sur le VPS
# -----------------------------------------------------------------------------
echo ""
echo ">>> Étape 1/4 : Installation et démarrage de MongoDB sur le VPS..."

$SSH_CMD "$REMOTE" bash -s << 'REMOTE_INSTALL'
set -e
export DEBIAN_FRONTEND=noninteractive

if ! command -v apt-get &>/dev/null; then
  echo "Erreur: ce script nécessite Debian/Ubuntu (apt-get)."
  exit 1
fi

if command -v mongod &>/dev/null; then
  echo "  MongoDB déjà installé."
  systemctl start mongod 2>/dev/null || true
  systemctl enable mongod 2>/dev/null || true
  echo "  Service mongod démarré et activé."
  exit 0
fi

echo "  Mise à jour des paquets..."
apt-get update -qq

echo "  Installation des dépendances..."
apt-get install -y -qq curl ca-certificates gnupg

echo "  Ajout du dépôt MongoDB..."
UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
# Ubuntu 24 (noble) n'a pas de repo MongoDB officiel -> utiliser jammy
[ "$UBUNTU_CODENAME" = "noble" ] && UBUNTU_CODENAME="jammy"

curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --batch --yes -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt-get update -qq
apt-get install -y -qq mongodb-org

mkdir -p /data/db
chown -R mongodb:mongodb /data/db 2>/dev/null || true

systemctl start mongod
systemctl enable mongod
echo "  MongoDB installé et démarré."
REMOTE_INSTALL

# Fix: use SSH_CMD (we use it below but defined after - need to define before first use)
SSH_CMD="sshpass -e ssh $SSH_OPTS"
$SSH_CMD "$REMOTE" bash -s << 'REMOTE_INSTALL'
set -e
export DEBIAN_FRONTEND=noninteractive
if ! command -v apt-get &>/dev/null; then exit 1; fi
if command -v mongod &>/dev/null; then
  systemctl start mongod 2>/dev/null || true
  systemctl enable mongod 2>/dev/null || true
  echo "  MongoDB déjà installé, service démarré."
  exit 0
fi
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg
UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
[ "$UBUNTU_CODENAME" = "noble" ] && UBUNTU_CODENAME="jammy"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --batch --yes -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update -qq
apt-get install -y -qq mongodb-org
mkdir -p /data/db
chown -R mongodb:mongodb /data/db 2>/dev/null || true
systemctl start mongod
systemctl enable mongod
echo "  MongoDB installé et démarré."
REMOTE_INSTALL

Wait - I referenced $SSH_CMD before defining it in the first REMOTE_INSTALL. Let me fix the script: define SSH_CMD at the top after SSHPASS check.
</think>
Corrigeant le script : définir `SSH_CMD` avant la première utilisation.
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
Read