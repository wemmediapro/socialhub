#!/bin/bash

# Script de restauration MongoDB
# Usage: ./restore-mongodb.sh [fichier_backup]

set -e

BACKUP_DIR="/root/socialhub_global_v5/backups"

if [ -z "$1" ]; then
    echo "📋 Sauvegardes disponibles:"
    ls -la "$BACKUP_DIR"/mongodb_backup_*.tar.gz 2>/dev/null || echo "Aucune sauvegarde trouvée"
    echo ""
    echo "Usage: $0 <fichier_backup>"
    echo "Exemple: $0 mongodb_backup_20241215_143022.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"
FULL_PATH="$BACKUP_DIR/$BACKUP_FILE"

if [ ! -f "$FULL_PATH" ]; then
    echo "❌ Fichier de sauvegarde non trouvé: $FULL_PATH"
    exit 1
fi

echo "🔄 Arrêt des services..."
docker-compose down

echo "📦 Copie du fichier de sauvegarde dans le conteneur..."
docker cp "$FULL_PATH" socialhub_global_v5-mongo-1:/tmp/

echo "🗜️ Extraction de la sauvegarde..."
docker exec socialhub_global_v5-mongo-1 tar -xzf /tmp/$BACKUP_FILE -C /tmp

echo "🔄 Restauration de la base de données..."
docker exec socialhub_global_v5-mongo-1 mongorestore --drop /tmp/backup

echo "🧹 Nettoyage temporaire..."
docker exec socialhub_global_v5-mongo-1 rm -rf /tmp/backup /tmp/$BACKUP_FILE

echo "🚀 Redémarrage des services..."
docker-compose up -d

echo "✅ Restauration terminée!"
echo "🔍 Vérification:"
sleep 5
docker-compose ps
