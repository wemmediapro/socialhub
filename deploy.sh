#!/bin/bash

# Script de déploiement automatique pour SocialHub Global V5
# Usage: ./deploy.sh

# Ne pas arrêter en cas d'erreur pour Git (on continue même si le pull échoue)
set +e

echo "🚀 Début du déploiement SocialHub..."
echo "=================================="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/root/socialhub_global_v5"
LOG_DIR="$APP_DIR/logs"

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "$APP_DIR/package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé dans $APP_DIR${NC}"
    exit 1
fi

cd $APP_DIR

# Vérifier les services Docker
echo -e "${YELLOW}🐳 Vérification des services Docker...${NC}"
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Démarrage des services Docker...${NC}"
    docker-compose up -d
    sleep 5
fi

# Backup automatique de la base de données avant déploiement
echo -e "${YELLOW}💾 Backup automatique de la base de données...${NC}"
if [ -f "$APP_DIR/backup-mongodb.sh" ]; then
    bash "$APP_DIR/backup-mongodb.sh" || echo -e "${YELLOW}⚠️  Le backup a échoué, mais on continue le déploiement...${NC}"
elif [ -f "$APP_DIR/scripts/backup-mongodb.sh" ]; then
    bash "$APP_DIR/scripts/backup-mongodb.sh" || echo -e "${YELLOW}⚠️  Le backup a échoué, mais on continue le déploiement...${NC}"
else
    # Backup manuel si le script n'existe pas
    BACKUP_DIR="/root/backups/mongodb"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    CONTAINER_NAME="socialhub_global_v5-mongo-1"
    MONGO_USERNAME="${MONGO_USERNAME:-admin}"
    MONGO_PASSWORD="${MONGO_PASSWORD:-admin123}"
    MONGO_DATABASE="${MONGO_DATABASE:-socialhub}"
    MONGO_AUTH_DB="${MONGO_AUTH_DB:-admin}"
    
    if docker ps | grep -q $CONTAINER_NAME; then
        echo -e "${YELLOW}📦 Création d'un backup manuel...${NC}"
        mkdir -p $BACKUP_DIR
        docker exec $CONTAINER_NAME mongodump \
            --username=$MONGO_USERNAME \
            --password=$MONGO_PASSWORD \
            --authenticationDatabase=$MONGO_AUTH_DB \
            --db=$MONGO_DATABASE \
            --out=/tmp/backup 2>&1 | grep -v "writing" || true
        docker cp $CONTAINER_NAME:/tmp/backup $BACKUP_DIR/backup_$TIMESTAMP 2>/dev/null || true
        docker exec $CONTAINER_NAME rm -rf /tmp/backup 2>/dev/null || true
        if [ -d "$BACKUP_DIR/backup_$TIMESTAMP" ]; then
            cd $BACKUP_DIR
            tar -czf backup_$TIMESTAMP.tar.gz backup_$TIMESTAMP 2>/dev/null || true
            rm -rf backup_$TIMESTAMP 2>/dev/null || true
            cd $APP_DIR
            echo -e "${GREEN}✅ Backup créé: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Conteneur MongoDB non trouvé, skip backup${NC}"
    fi
fi
echo ""

# Pull les dernières modifications (si Git est utilisé)
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 Récupération des dernières modifications...${NC}"
    
    # Vérifier s'il y a des modifications locales qui pourraient causer un conflit
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  Modifications locales détectées. Tentative de résolution...${NC}"
        
        # Essayer d'écraser les fichiers en conflit courants
        git checkout -- backup-mongodb.sh deploy.sh 2>/dev/null || true
        
        # Si toujours des modifications, stash
        if [ -n "$(git status --porcelain)" ]; then
            echo -e "${YELLOW}💾 Sauvegarde des modifications locales...${NC}"
            git stash push -m "Sauvegarde avant pull - $(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
        fi
    fi
    
    # Essayer de pull depuis main
    if git pull origin main 2>/dev/null; then
        echo -e "${GREEN}✅ Modifications récupérées depuis main${NC}"
    else
        echo -e "${YELLOW}⚠️  Impossible de récupérer depuis main, continuation sans pull${NC}"
        echo -e "${YELLOW}   (Vous pouvez faire 'git pull origin main' manuellement plus tard)${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  Pas de dépôt Git détecté, skip pull${NC}"
fi

# Réactiver l'arrêt en cas d'erreur pour les étapes critiques
set -e

# Installer les nouvelles dépendances
echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
npm install --production=false

# Builder l'application
echo -e "${YELLOW}🏗️  Build de l'application...${NC}"
npm run build

# Créer le dossier logs s'il n'existe pas
mkdir -p $LOG_DIR

# Redémarrer les services PM2
echo -e "${YELLOW}🔄 Redémarrage des services PM2...${NC}"
if pm2 describe socialhub-app > /dev/null 2>&1; then
    pm2 restart ecosystem.config.js
else
    pm2 start ecosystem.config.js
    pm2 save
fi

# Attendre un peu que les services démarrent
sleep 3

# Afficher le statut
echo ""
echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo "=================================="
echo ""

# Statut des services
echo -e "${GREEN}📊 Statut des services:${NC}"
pm2 status

echo ""
echo -e "${GREEN}🔗 URLs:${NC}"
echo "  Application: https://socialhub.votredomaine.com"
echo "  Login: https://socialhub.votredomaine.com/login"
echo ""
echo -e "${GREEN}📝 Commandes utiles:${NC}"
echo "  Logs: pm2 logs"
echo "  Statut: pm2 status"
echo "  Redémarrer: pm2 restart all"
echo "  Monitoring: pm2 monit"
echo ""
