#!/usr/bin/env bash
# =============================================================================
# Applique la correction Nginx pour les uploads (413 Request Entity Too Large).
# À lancer depuis votre machine : se connecte au VPS et met à jour la config
# (client_max_body_size 200M, timeouts 300s) puis recharge Nginx.
#
# Usage :
#   export SSHPASS='VOTRE_MOT_DE_PASSE'
#   export SSH_HOST=187.77.168.205   # ou l'IP / hostname de votre VPS
#   ./scripts/apply-nginx-upload-fix.sh
#
# Ou en une ligne :
#   SSHPASS='mot_de_passe' SSH_HOST=africamediaconnect.fr ./scripts/apply-nginx-upload-fix.sh
# =============================================================================

set -e

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-}"

if [ -z "$SSH_HOST" ]; then
  echo "Définissez SSH_HOST (IP ou hostname du VPS)."
  echo "Exemple: export SSH_HOST=africamediaconnect.fr && $0"
  exit 1
fi

if [ -n "$SSHPASS" ]; then
  export SSHPASS
  SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
else
  SSH_CMD="ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
fi

REMOTE="${SSH_USER}@${SSH_HOST}"

echo ">>> Connexion à ${REMOTE} pour appliquer la correction Nginx (upload 200 Mo)..."
$SSH_CMD "$REMOTE" bash -s << 'REMOTE_SCRIPT'
set -e
echo ">>> Sauvegarde des configs Nginx..."
for f in /etc/nginx/sites-available/*; do
  [ -f "$f" ] && cp -a "$f" "${f}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true
done
for f in /etc/nginx/sites-enabled/*; do
  [ -f "$f" ] && cp -a "$f" "${f}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true
done
echo ">>> Mise à jour client_max_body_size et timeouts..."
for f in /etc/nginx/sites-available/*; do
  [ -f "$f" ] || continue
  if grep -q "proxy_pass\|proxy_pass " "$f" 2>/dev/null; then
    # Remplacer la limite existante ou l'ajouter si absente
    if grep -q "client_max_body_size" "$f"; then
      sed -i 's/client_max_body_size [0-9]*[mM]/client_max_body_size 200M/' "$f"
    else
      sed -i '0,/server {/s/server {/server {\n    client_max_body_size 200M;/' "$f"
    fi
    sed -i 's/proxy_read_timeout [0-9]*s*;/proxy_read_timeout 300s;/g' "$f"
    sed -i 's/proxy_connect_timeout [0-9]*s*;/proxy_connect_timeout 300s;/g' "$f"
    sed -i 's/proxy_send_timeout [0-9]*s*;/proxy_send_timeout 300s;/g' "$f"
    echo "    Modifié: $f"
  fi
done
# Idem pour sites-enabled si ce sont des fichiers (pas des symlinks)
for f in /etc/nginx/sites-enabled/*; do
  [ -f "$f" ] && [ ! -L "$f" ] || continue
  if grep -q "proxy_pass" "$f" 2>/dev/null && ! grep -q "client_max_body_size 200M" "$f"; then
    if grep -q "client_max_body_size" "$f"; then
      sed -i 's/client_max_body_size [0-9]*[mM]/client_max_body_size 200M/' "$f"
    else
      sed -i '0,/server {/s/server {/server {\n    client_max_body_size 200M;/' "$f"
    fi
    echo "    Modifié: $f"
  fi
done
echo ">>> Test et rechargement Nginx..."
nginx -t && systemctl reload nginx
echo ">>> Nginx rechargé. Uploads jusqu'à 200 Mo autorisés."
REMOTE_SCRIPT

echo ""
echo ">>> Correction appliquée sur le serveur."
echo "    Vous pouvez réessayer l'upload de votre vidéo."
echo ""
