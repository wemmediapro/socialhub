#!/bin/bash

# Script d'installation initiale du VPS pour SocialHub
# À exécuter en tant que root sur un VPS Hostinger Ubuntu 20.04+
# Usage: wget -O - https://votre-repo/setup-vps.sh | bash
# OU: bash setup-vps.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════╗"
echo "║                                                ║"
echo "║     🚀 SocialHub VPS Setup Script            ║"
echo "║     Configuration automatique du serveur      ║"
echo "║                                                ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Vérifier qu'on est root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Ce script doit être exécuté en tant que root${NC}"
    echo "   Utilisez: sudo bash setup-vps.sh"
    exit 1
fi

# Variables
APP_USER="socialhub"
APP_DIR="/home/$APP_USER/socialhub_global_v5"

echo -e "${YELLOW}📋 Ce script va installer:${NC}"
echo "   • Node.js 18.x (via NVM)"
echo "   • Docker & Docker Compose"
echo "   • PM2 (Process Manager)"
echo "   • Nginx"
echo "   • Firewall (UFW)"
echo ""
read -p "Continuer? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation annulée"
    exit 1
fi

echo ""
echo -e "${GREEN}🔄 Étape 1/8: Mise à jour du système${NC}"
apt update && apt upgrade -y
apt install -y curl wget git vim ufw build-essential software-properties-common

echo ""
echo -e "${GREEN}🔄 Étape 2/8: Configuration du firewall (UFW)${NC}"
ufw --force enable
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw status

echo ""
echo -e "${GREEN}🔄 Étape 3/8: Installation de Docker${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Installer Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✅ Docker installé${NC}"
else
    echo -e "${YELLOW}ℹ️  Docker déjà installé${NC}"
fi

echo ""
echo -e "${GREEN}🔄 Étape 4/8: Installation de Nginx${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo -e "${GREEN}✅ Nginx installé${NC}"
else
    echo -e "${YELLOW}ℹ️  Nginx déjà installé${NC}"
fi

echo ""
echo -e "${GREEN}🔄 Étape 5/8: Création de l'utilisateur '$APP_USER'${NC}"
if id "$APP_USER" &>/dev/null; then
    echo -e "${YELLOW}ℹ️  L'utilisateur $APP_USER existe déjà${NC}"
else
    adduser --disabled-password --gecos "" $APP_USER
    usermod -aG sudo $APP_USER
    usermod -aG docker $APP_USER
    echo -e "${GREEN}✅ Utilisateur $APP_USER créé${NC}"
fi

echo ""
echo -e "${GREEN}🔄 Étape 6/8: Installation de Node.js (NVM)${NC}"
# Installer NVM pour l'utilisateur socialhub
su - $APP_USER <<'EOF'
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 18
    nvm use 18
    nvm alias default 18
    echo "✅ Node.js installé"
else
    echo "ℹ️  NVM déjà installé"
fi
EOF

echo ""
echo -e "${GREEN}🔄 Étape 7/8: Installation de PM2${NC}"
su - $APP_USER <<'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup | tail -1 | bash
    echo "✅ PM2 installé"
else
    echo "ℹ️  PM2 déjà installé"
fi
EOF

echo ""
echo -e "${GREEN}🔄 Étape 8/8: Création des répertoires${NC}"
su - $APP_USER <<'EOF'
mkdir -p ~/backups/mongodb
mkdir -p ~/socialhub_global_v5/logs
chmod 755 ~/backups
chmod 755 ~/socialhub_global_v5
EOF

echo ""
echo -e "${GREEN}✅ Installation de base terminée!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📝 Prochaines étapes:${NC}"
echo ""
echo "1. Se connecter en tant qu'utilisateur socialhub:"
echo -e "   ${YELLOW}su - socialhub${NC}"
echo ""
echo "2. Cloner votre projet:"
echo -e "   ${YELLOW}cd ~${NC}"
echo -e "   ${YELLOW}git clone https://github.com/votre-repo/socialhub_global_v5.git${NC}"
echo -e "   ${YELLOW}cd socialhub_global_v5${NC}"
echo ""
echo "3. Configurer les variables d'environnement:"
echo -e "   ${YELLOW}nano .env${NC}"
echo "   (Copier les valeurs depuis .env.example)"
echo ""
echo "4. Démarrer les services Docker:"
echo -e "   ${YELLOW}docker-compose up -d${NC}"
echo ""
echo "5. Installer et builder l'application:"
echo -e "   ${YELLOW}npm install${NC}"
echo -e "   ${YELLOW}npm run build${NC}"
echo ""
echo "6. Démarrer avec PM2:"
echo -e "   ${YELLOW}pm2 start ecosystem.config.js${NC}"
echo -e "   ${YELLOW}pm2 save${NC}"
echo ""
echo "7. Configurer Nginx (voir DEPLOIEMENT_VPS_HOSTINGER.md)"
echo ""
echo "8. Configurer SSL avec Certbot:"
echo -e "   ${YELLOW}sudo apt install certbot python3-certbot-nginx${NC}"
echo -e "   ${YELLOW}sudo certbot --nginx -d socialhub.votredomaine.com${NC}"
echo ""
echo -e "${GREEN}📚 Documentation complète: DEPLOIEMENT_VPS_HOSTINGER.md${NC}"
echo ""

# Afficher les versions installées
echo -e "${BLUE}🔍 Versions installées:${NC}"
docker --version
docker-compose --version
nginx -v
echo -n "Node.js: "
su - $APP_USER -c "source ~/.nvm/nvm.sh && node --version"
echo -n "npm: "
su - $APP_USER -c "source ~/.nvm/nvm.sh && npm --version"
echo -n "PM2: "
su - $APP_USER -c "source ~/.nvm/nvm.sh && pm2 --version"
echo ""

echo -e "${GREEN}🎉 Serveur prêt pour le déploiement de SocialHub!${NC}"
echo ""

