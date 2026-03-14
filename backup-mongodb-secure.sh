#!/bin/bash

# Script de sauvegarde sécurisée MongoDB
# Usage: ./backup-mongodb-secure.sh

set -e

BACKUP_DIR="/root/socialhub_global_v5/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mongodb_backup_$DATE.tar.gz"

echo "🔄 Création du dossier de sauvegarde..."
mkdir -p "$BACKUP_DIR"

echo "📦 Sauvegarde de la base de données MongoDB..."
docker exec socialhub_global_v5-mongo-1 mongodump --out /tmp/backup

echo "🗜️ Compression de la sauvegarde..."
docker exec socialhub_global_v5-mongo-1 tar -czf /tmp/$BACKUP_FILE -C /tmp backup

echo "📁 Copie de la sauvegarde..."
docker cp socialhub_global_v5-mongo-1:/tmp/$BACKUP_FILE "$BACKUP_DIR/"

echo "🧹 Nettoyage temporaire..."
docker exec socialhub_global_v5-mongo-1 rm -rf /tmp/backup /tmp/$BACKUP_FILE

echo "✅ Sauvegarde terminée: $BACKUP_DIR/$BACKUP_FILE"

# Garder seulement les 7 dernières sauvegardes
echo "🗑️ Nettoyage des anciennes sauvegardes..."
cd "$BACKUP_DIR"
ls -t mongodb_backup_*.tar.gz | tail -n +8 | xargs -r rm -f

echo "📊 Sauvegardes disponibles:"
ls -la mongodb_backup_*.tar.gz 2>/dev/null || echo "Aucune sauvegarde trouvée"
