#!/usr/bin/env bash
# =============================================================================
# Configure le VPS pour héberger Social Hub : Nginx (reverse proxy), SSL Let's
# Encrypt, firewall. À lancer une fois après le premier déploiement.
#
# Prérequis : un nom de domaine pointant vers l'IP du VPS (31.97.199.38).
#
# Usage :
#   export SSHPASS='VOTRE_MOT_DE_PASSE'
#   export DOMAIN=app.votredomaine.com
#   ./scripts/setup-vps-nginx.sh
#
# Sans domaine (HTTP uniquement sur le port 80) :
#   export DOMAIN=
#   ./scripts/setup-vps-nginx.sh
# =============================================================================

set -e

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-31.97.199.38}"
DOMAIN="${DOMAIN:-}"

SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ServerAliveCountMax=10 -o ConnectTimeout=30"
if [ -n "$SSHPASS" ]; then
  export SSHPASS
  SSH_CMD="sshpass -e ssh $SSH_OPTS"
elif [ -n "$1" ] && [ -z "$DOMAIN" ]; then
  export SSHPASS="$1"
  SSH_CMD="sshpass -e ssh $SSH_OPTS"
else
  echo "Usage: export SSHPASS='mot_de_passe' && export DOMAIN=app.votredomaine.com && $0"
  echo "   ou: $0 'mot_de_passe'   (avec DOMAIN déjà exporté)"
  exit 1
fi

REMOTE="${SSH_USER}@${SSH_HOST}"

echo "=============================================="
echo "  Configuration Nginx + SSL sur le VPS"
echo "  Serveur: ${REMOTE}"
echo "  Domaine: ${DOMAIN:-'(HTTP seul, pas de SSL)'}"
echo "=============================================="

$SSH_CMD "$REMOTE" bash -s -- "$DOMAIN" << 'REMOTE_SETUP'
set -e
DOMAIN="$1"
export DEBIAN_FRONTEND=noninteractive

if ! command -v apt-get &>/dev/null; then
  echo "Ce script est prévu pour Debian/Ubuntu (apt-get)."
  exit 1
fi

echo ""
echo ">>> Mise à jour et installation Nginx..."
apt-get update -qq
apt-get install -y -qq nginx

echo ">>> Création de la configuration Nginx..."
if [ -n "$DOMAIN" ]; then
  SERVER_NAME="$DOMAIN"
else
  SERVER_NAME="_"
fi

cat > /etc/nginx/sites-available/socialhub << NGINXEOF
upstream socialhub_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name SERVER_NAME_PLACEHOLDER;

    client_max_body_size 200M;

    location / {
        proxy_pass http://socialhub_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    location /_next/static {
        proxy_pass http://socialhub_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINXEOF

sed -i "s/SERVER_NAME_PLACEHOLDER/$SERVER_NAME/" /etc/nginx/sites-available/socialhub

ln -sf /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t && systemctl reload nginx
echo "  Nginx configuré et rechargé."

if [ -n "$DOMAIN" ]; then
  echo ""
  echo ">>> Installation de Certbot et obtention du certificat SSL..."
  apt-get install -y -qq certbot python3-certbot-nginx 2>/dev/null || apt-get install -y -qq certbot python3-certbot-nginx
  if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>/dev/null; then
    echo "  SSL activé pour $DOMAIN (redirection HTTP -> HTTPS)."
  else
    echo "  Certbot a échoué. Vérifiez que le DNS de $DOMAIN pointe vers ce serveur."
    echo "  Relancer plus tard : certbot --nginx -d $DOMAIN"
  fi
fi

echo ""
echo ">>> Configuration du pare-feu (ufw)..."
if command -v ufw &>/dev/null; then
  ufw allow 22/tcp  2>/dev/null || true
  ufw allow 80/tcp  2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
  echo "y" | ufw enable 2>/dev/null || true
  echo "  Règles ufw : 22, 80, 443 autorisés."
else
  echo "  ufw non disponible ; configurez le pare-feu manuellement (ports 22, 80, 443)."
fi

echo ""
echo ">>> Terminé."
REMOTE_SETUP

echo ""
echo "=============================================="
if [ -n "$DOMAIN" ]; then
  echo "  Accès : https://${DOMAIN}"
else
  echo "  Accès : http://${SSH_HOST}"
fi
echo "  Pensez à définir APP_URL dans .env sur le serveur"
echo "  et à redéployer : ./scripts/deploy-full.sh"
echo "=============================================="
