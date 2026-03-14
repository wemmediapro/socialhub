#!/bin/bash

# Script de backup automatique MongoDB pour SocialHub
# Usage: ./backup-mongodb.sh

set -e  # Arrêter en cas d'erreur

# Configuration
BACKUP_DIR="/root/backups/mongodb"
MONGO_USERNAME="${MONGO_USERNAME:-admin}"
MONGO_PASSWORD="${MONGO_PASSWORD:-admin123}"
MONGO_DATABASE="${MONGO_DATABASE:-socialhub}"
MONGO_AUTH_DB="${MONGO_AUTH_DB:-admin}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_READABLE=$(date +"%Y-%m-%d %H:%M:%S")
CONTAINER_NAME="socialhub_global_v5-mongo-1"
RETENTION_DAYS=7

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Début du backup MongoDB - $DATE_READABLE${NC}"
echo "=================================================="

# Créer le répertoire de backup s'il n'existe pas
mkdir -p $BACKUP_DIR

# Vérifier que le conteneur MongoDB est actif
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}❌ Erreur: Le conteneur MongoDB n'est pas actif${NC}"
    exit 1
fi

# Créer le backup avec authentification
echo -e "${YELLOW}📦 Création du dump MongoDB...${NC}"
docker exec $CONTAINER_NAME mongodump \
    --username=$MONGO_USERNAME \
    --password=$MONGO_PASSWORD \
    --authenticationDatabase=$MONGO_AUTH_DB \
    --db=$MONGO_DATABASE \
    --out=/tmp/backup 2>&1 | grep -v "writing" || {
    echo -e "${RED}❌ Erreur lors de la création du dump${NC}"
    exit 1
}

# Copier le backup hors du conteneur
echo -e "${YELLOW}📤 Export du backup...${NC}"
docker cp $CONTAINER_NAME:/tmp/backup $BACKUP_DIR/backup_$TIMESTAMP

# Compresser le backup
echo -e "${YELLOW}🗜️  Compression du backup...${NC}"
cd $BACKUP_DIR
tar -czf backup_$TIMESTAMP.tar.gz backup_$TIMESTAMP
rm -rf backup_$TIMESTAMP

# Nettoyer le backup dans le conteneur
docker exec $CONTAINER_NAME rm -rf /tmp/backup

# Taille du backup
BACKUP_SIZE=$(du -h $BACKUP_DIR/backup_$TIMESTAMP.tar.gz | cut -f1)

# Garder seulement les backups des X derniers jours
echo -e "${YELLOW}🧹 Nettoyage des anciens backups (> $RETENTION_DAYS jours)...${NC}"
find $BACKUP_DIR -name "backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

# Compter les backups restants
BACKUP_COUNT=$(ls -1 $BACKUP_DIR/backup_*.tar.gz 2>/dev/null | wc -l)

echo ""
echo -e "${GREEN}✅ Backup terminé avec succès!${NC}"
echo "=================================================="
echo -e "${GREEN}📁 Fichier:${NC} backup_$TIMESTAMP.tar.gz"
echo -e "${GREEN}📏 Taille:${NC} $BACKUP_SIZE"
echo -e "${GREEN}📊 Nombre de backups:${NC} $BACKUP_COUNT"
echo -e "${GREEN}📂 Répertoire:${NC} $BACKUP_DIR"
echo ""

# Lister les 5 derniers backups
echo -e "${GREEN}📋 Derniers backups:${NC}"
ls -lht $BACKUP_DIR/backup_*.tar.gz | head -5 | awk '{print "  " $9 " (" $5 ")"}'
echo ""

# Instructions de restauration
echo -e "${YELLOW}ℹ️  Pour restaurer ce backup:${NC}"
echo "  cd $BACKUP_DIR"
echo "  tar -xzf backup_$TIMESTAMP.tar.gz"
echo "  docker cp backup_$TIMESTAMP $CONTAINER_NAME:/tmp/restore"
echo "  docker exec $CONTAINER_NAME mongorestore --username=$MONGO_USERNAME --password=$MONGO_PASSWORD --authenticationDatabase=$MONGO_AUTH_DB /tmp/restore"
echo ""

