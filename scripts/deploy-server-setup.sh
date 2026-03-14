#!/usr/bin/env bash
# =============================================================================
# Script : Créer le dossier social sur le serveur et préparer l'hébergement
# Usage : 
#   export SSHPASS='VOTRE_MOT_DE_PASSE'
#   ./scripts/deploy-server-setup.sh
# Ou : ./scripts/deploy-server-setup.sh  (le script demandera le mot de passe)
# =============================================================================

set -e

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-187.77.168.205}"
REMOTE_BASE="${REMOTE_BASE:-/root/social}"

# Mot de passe : variable d'environnement SSHPASS (recommandé) ou premier argument
if [ -n "$SSHPASS" ]; then
  export SSHPASS
  SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new"
elif [ -n "$1" ]; then
  export SSHPASS="$1"
  SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new"
else
  echo "Usage: export SSHPASS='votre_mot_de_passe' && $0"
  echo "   ou: $0 'votre_mot_de_passe'"
  echo ""
  echo "Connexion: ${SSH_USER}@${SSH_HOST}"
  echo "Dossier cible: ${REMOTE_BASE}"
  exit 1
fi

REMOTE="${SSH_USER}@${SSH_HOST}"

echo ">>> Connexion à ${REMOTE} et création de la structure ${REMOTE_BASE}..."

$SSH_CMD "$REMOTE" bash -s -- "$REMOTE_BASE" << 'REMOTE_SCRIPT'
set -e
BASE="$1"
echo "Création de $BASE et sous-dossiers..."
mkdir -p "$BASE"/{app,uploads,data}
echo "  - $BASE/app      (application Next.js)"
echo "  - $BASE/uploads  (médias / fichiers uploadés)"
echo "  - $BASE/data     (données MongoDB)"
touch "$BASE/.gitkeep"
chmod -R 755 "$BASE"
echo ">>> Structure créée avec succès."
ls -la "$BASE"
REMOTE_SCRIPT

echo ""
echo ">>> Terminé. Prochaine étape : déployer l'app avec scripts/deploy-push.sh"
