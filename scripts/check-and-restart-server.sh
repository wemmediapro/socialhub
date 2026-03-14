#!/usr/bin/env bash
# =============================================================================
# Vérifie et redémarre Nginx + l'app sur le VPS (en cas de ERR_CONNECTION_REFUSED).
# Usage: SSHPASS='mot_de_passe' SSH_HOST=africamediaconnect.fr ./scripts/check-and-restart-server.sh
# =============================================================================

set -e

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-}"

if [ -z "$SSH_HOST" ]; then
  echo "Définissez SSH_HOST. Exemple: export SSH_HOST=africamediaconnect.fr && $0"
  exit 1
fi

if [ -n "$SSHPASS" ]; then
  export SSHPASS
  SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
else
  SSH_CMD="ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
fi

REMOTE="${SSH_USER}@${SSH_HOST}"
REMOTE_APP="${REMOTE_APP:-/root/social/app}"
REMOTE_UPLOADS="${REMOTE_UPLOADS:-/root/social/uploads}"

echo ">>> Connexion à ${REMOTE}..."
$SSH_CMD "$REMOTE" bash -s -- "$REMOTE_APP" "$REMOTE_UPLOADS" << 'REMOTE_SCRIPT'
set -e
APP="$1"
UPLOADS="$2"
echo ">>> État Nginx..."
systemctl status nginx --no-pager 2>/dev/null || true
echo ""
echo ">>> État PM2 (si utilisé)..."
pm2 list 2>/dev/null || echo "pm2 non utilisé ou pas d'apps"
echo ""
echo ">>> Redémarrage Nginx..."
systemctl restart nginx
echo ">>> Redémarrage de l'app (pm2 ou manuel)..."
if command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q socialhub; then
  pm2 restart socialhub
  echo "  pm2 restart socialhub OK"
elif command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "online"; then
  pm2 restart all
  echo "  pm2 restart all OK"
else
  echo "  Aucune app pm2 nommée socialhub. Pour démarrer l'app:"
  echo "  cd $APP && LOCAL_UPLOAD_DIR=$UPLOADS pm2 start npm --name socialhub -- start"
fi
echo ""
echo ">>> Vérification port 80..."
ss -tlnp 2>/dev/null | grep ':80 ' || netstat -tlnp 2>/dev/null | grep ':80 ' || true
echo ">>> Vérification port 3000 (app Next.js)..."
ss -tlnp 2>/dev/null | grep ':3000 ' || netstat -tlnp 2>/dev/null | grep ':3000 ' || true
echo ""
echo ">>> Terminé. Réessayez le site dans le navigateur."
REMOTE_SCRIPT

echo ""
echo "Si le site reste inaccessible, connectez-vous au serveur et lancez l'app à la main:"
echo "  ssh $REMOTE"
echo "  cd /root/social/app && LOCAL_UPLOAD_DIR=/root/social/uploads npm start"
echo "  (ou: pm2 start npm --name socialhub -- start)"
echo ""
