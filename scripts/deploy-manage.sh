#!/usr/bin/env bash
# =============================================================================
# Script de gestion : déploiement + option Nginx/SSL sur le VPS 31.97.199.38
#
# Usage :
#   export SSHPASS='VOTRE_MOT_DE_PASSE'
#   ./scripts/deploy-manage.sh
#
# Avec domaine et HTTPS :
#   export SSHPASS='...' APP_URL='https://app.domaine.com' DOMAIN='app.domaine.com'
#   ./scripts/deploy-manage.sh
#
# Options :
#   --deploy-only     Déploie l'app uniquement (pas Nginx)
#   --nginx-only      Configure Nginx/SSL uniquement (DOMAIN requis)
#   --status          Affiche l'état sur le serveur (pm2, nginx)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SSH_HOST="${SSH_HOST:-31.97.199.38}"
DEPLOY_ONLY=false
NGINX_ONLY=false
STATUS_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --deploy-only)  DEPLOY_ONLY=true ;;
    --nginx-only)   NGINX_ONLY=true ;;
    --status)       STATUS_ONLY=true ;;
    -h|--help)
      echo "Usage: $0 [--deploy-only | --nginx-only | --status]"
      echo "  Déploiement par défaut : deploy-full.sh puis setup-vps-nginx.sh si DOMAIN est défini."
      exit 0
      ;;
  esac
done

if [ -z "$SSHPASS" ] && [ -n "$1" ] && [[ ! "$1" =~ ^-- ]]; then
  export SSHPASS="$1"
fi

if [ -z "$SSHPASS" ]; then
  echo "Définir le mot de passe SSH : export SSHPASS='votre_mot_de_passe'"
  echo "  ou : $0 'votre_mot_de_passe'"
  exit 1
fi

cd "$PROJECT_ROOT"

if [ "$STATUS_ONLY" = true ]; then
  echo ">>> État du serveur ${SSH_HOST}..."
  export SSHPASS
  sshpass -e ssh -o StrictHostKeyChecking=accept-new "root@${SSH_HOST}" "echo '--- PM2 ---' && (pm2 status 2>/dev/null || echo 'pm2 non installé'); echo '--- Nginx ---' && (systemctl is-active nginx 2>/dev/null || echo 'nginx inactif'); echo '--- MongoDB ---' && (systemctl is-active mongod 2>/dev/null || echo 'mongod inactif')"
  exit 0
fi

if [ "$NGINX_ONLY" = true ]; then
  if [ -z "$DOMAIN" ]; then
    echo "Pour --nginx-only, définir le domaine : export DOMAIN=app.votredomaine.com"
    exit 1
  fi
  echo ">>> Configuration Nginx + SSL uniquement (DOMAIN=$DOMAIN)"
  exec "$SCRIPT_DIR/setup-vps-nginx.sh"
fi

echo ">>> Étape 1/2 : Déploiement de l'application..."
"$SCRIPT_DIR/deploy-full.sh"

if [ "$DEPLOY_ONLY" = true ] || [ -z "$DOMAIN" ]; then
  echo ""
  echo ">>> Terminé. (Pour Nginx+SSL : export DOMAIN=app.domaine.com && $0)"
  exit 0
fi

echo ""
echo ">>> Étape 2/2 : Configuration Nginx + SSL pour $DOMAIN..."
"$SCRIPT_DIR/setup-vps-nginx.sh"

echo ""
echo ">>> Tout est en place. Accès : ${APP_URL:-https://$DOMAIN}"
