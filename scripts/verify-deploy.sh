#!/usr/bin/env bash
# =============================================================================
# Vérifie que l'application, les médias et (si possible) la base MongoDB
# sont bien présents sur le VPS.
#
# Usage : export SSHPASS='...' && ./scripts/verify-deploy.sh
# =============================================================================

set -e

SSH_HOST="${SSH_HOST:-31.97.199.38}"
SSH_USER="${SSH_USER:-root}"
REMOTE_BASE="${REMOTE_BASE:-/root/social}"
REMOTE_APP="${REMOTE_BASE}/app"
REMOTE_UPLOADS="${REMOTE_BASE}/uploads"

if [ -z "$SSHPASS" ]; then
  echo "Usage: export SSHPASS='votre_mot_de_passe' && $0"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=============================================="
echo "  Vérification du déploiement sur le VPS"
echo "  Serveur: ${SSH_USER}@${SSH_HOST}"
echo "=============================================="

# Comptage local des médias (référence)
LOCAL_NB=$(find "$PROJECT_ROOT/public/uploads" -type f 2>/dev/null | wc -l | tr -d ' ')
LOCAL_SIZE=$(du -sh "$PROJECT_ROOT/public/uploads" 2>/dev/null | cut -f1 || echo "0")

export SSHPASS
sshpass -e ssh -o StrictHostKeyChecking=accept-new "${SSH_USER}@${SSH_HOST}" bash -s -- "$REMOTE_APP" "$REMOTE_UPLOADS" "$LOCAL_NB" "$LOCAL_SIZE" << 'REMOTE'
set -e
APP="$1"
UPLOADS="$2"
LOCAL_NB="$3"
LOCAL_SIZE="$4"

echo ""
echo "  1. APPLICATION"
echo "  --------------"
for f in "$APP/.env" "$APP/package.json" "$APP/.next/BUILD_ID" "$APP/src" "$APP/public"; do
  if [ -e "$f" ]; then
    echo "    OK  $f"
  else
    echo "    MANQUANT  $f"
  fi
done

echo ""
echo "  2. MÉDIAS (uploads)"
echo "  --------------------"
if [ -d "$UPLOADS" ]; then
  REMOTE_NB=$(find "$UPLOADS" -type f 2>/dev/null | wc -l | tr -d ' ')
  REMOTE_SIZE=$(du -sh "$UPLOADS" 2>/dev/null | cut -f1)
  echo "    Fichiers sur le serveur : $REMOTE_NB (local : $LOCAL_NB)"
  echo "    Taille sur le serveur   : $REMOTE_SIZE (local : $LOCAL_SIZE)"
  if [ "$REMOTE_NB" -eq "$LOCAL_NB" ] 2>/dev/null; then
    echo "    Statut : transfert médias cohérent"
  else
    echo "    Statut : écart de nombre de fichiers (relancer deploy pour resync)"
  fi
  if [ -L "$APP/public/uploads" ]; then
    echo "    Lien public/uploads -> uploads : OK"
  else
    echo "    Lien public/uploads : absent ou incorrect"
  fi
else
  echo "    Dossier $UPLOADS absent"
fi

echo ""
echo "  3. BASE DE DONNÉES MongoDB"
echo "  --------------------------"
if systemctl is-active mongod &>/dev/null; then
  echo "    Service mongod : actif"
  if command -v mongosh &>/dev/null; then
    mongosh --quiet --eval "
      const dbs = db.adminCommand({listDatabases:1}).databases;
      const sh = dbs.find(d => d.name === 'socialhub');
      if (sh) {
        const db = db.getSiblingDB('socialhub');
        const cols = db.getCollectionNames();
        print('    Base socialhub : présente');
        cols.forEach(c => print('      - ' + c + ': ' + db.getCollection(c).countDocuments() + ' doc(s)'));
      } else {
        print('    Base socialhub : non créée (sera créée au premier usage)');
      }
    " 2>/dev/null || echo "    (mongosh indisponible)"
  elif command -v mongo &>/dev/null; then
    mongo socialhub --quiet --eval "
      const cols = db.getCollectionNames();
      print('    Base socialhub : présente');
      cols.forEach(function(c){ print('      - ' + c + ': ' + db.getCollection(c).count() + ' doc(s)'); });
    " 2>/dev/null || echo "    Base socialhub : vide ou non créée"
  else
    echo "    Client mongo/mongosh non trouvé"
  fi
else
  echo "    Service mongod : inactif ou non installé"
  echo "    Pour installer/démarrer : relancer ./scripts/deploy-full.sh (phase 1 installe MongoDB)"
  echo "    Ou configurer MONGODB_URI vers un MongoDB distant dans $APP/.env"
fi

echo ""
echo "  4. PROCESSUS"
echo "  -----------"
if pm2 describe socialhub &>/dev/null; then
  pm2 list | head -10
else
  echo "    PM2 / socialhub : non trouvé"
fi

echo ""
echo "  Fin de la vérification."
REMOTE

echo ""
echo "=============================================="
echo "  Résumé : application et médias transférés."
echo "  Si MongoDB est inactif, les données ne sont"
echo "  pas encore sur le serveur (base vide ou distante)."
echo "=============================================="
