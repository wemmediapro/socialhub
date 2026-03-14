#!/bin/bash
# Script d'import / restauration MongoDB pour SocialHub
# Usage:
#   ./import-mongodb.sh                          # cherche backup dans ./backups/
#   ./import-mongodb.sh /chemin/vers/backup.tar.gz
#   ./import-mongodb.sh /chemin/vers/dossier_dump   # dossier déjà décompressé

set -e

# Configuration (sans auth par défaut pour MongoDB local)
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017}"
MONGO_DB="${MONGO_DATABASE:-socialhub}"
CONTAINER_NAME=""   # détecté automatiquement si Docker

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

usage() {
    echo "Usage: $0 [fichier_backup.tar.gz | dossier_dump]"
    echo ""
    echo "  Sans argument: utilise le dernier backup dans ./backups/"
    echo "  Avec .tar.gz : décompresse puis restaure"
    echo "  Avec dossier : restaure directement le dossier (contenu type socialhub/)"
    exit 1
}

# Détecter le conteneur MongoDB Docker si présent (uniquement si vraiment running, pas restarting)
detect_mongo_container() {
    for name in socialv7-mongo-1 socialhub_global_v7-mongo-1 socialhub_global_v6-mongo-1 socialhub_global_v5-mongo-1; do
        status=$(docker inspect --format '{{.State.Status}}' "$name" 2>/dev/null || true)
        if [ "$status" = "running" ]; then
            CONTAINER_NAME="$name"
            return
        fi
    done
    CONTAINER_NAME=""
}

# Restauration via Docker
restore_via_docker() {
    local dump_path="$1"
    local copy_src="$dump_path"
    # mongorestore attend un dossier qui contient une sous-dir au nom de la DB (ex: socialhub/)
    if [ "$(basename "$dump_path")" = "$MONGO_DB" ]; then
        copy_src="$(dirname "$dump_path")"
    fi
    echo -e "${YELLOW}📦 Copie du dump dans le conteneur...${NC}"
    docker cp "$copy_src" "$CONTAINER_NAME:/tmp/restore"
    echo -e "${YELLOW}🔄 Restauration MongoDB (mongorestore)...${NC}"
    docker exec "$CONTAINER_NAME" mongorestore --drop /tmp/restore
    docker exec "$CONTAINER_NAME" rm -rf /tmp/restore
    echo -e "${GREEN}✅ Restauration via Docker terminée.${NC}"
}

# Restauration locale (mongorestore sur la machine)
restore_local() {
    local dump_path="$1"
    if ! command -v mongorestore &>/dev/null; then
        echo -e "${RED}❌ mongorestore introuvable. Installez MongoDB Database Tools ou utilisez Docker.${NC}"
        exit 1
    fi
    # mongorestore attend le dossier parent contenant la sous-dir au nom de la DB
    local restore_dir="$dump_path"
    if [ "$(basename "$dump_path")" = "$MONGO_DB" ]; then
        restore_dir="$(dirname "$dump_path")"
    fi
    echo -e "${YELLOW}🔄 Restauration MongoDB (mongorestore)...${NC}"
    mongorestore --uri="$MONGO_URI" --db="$MONGO_DB" --drop "$restore_dir"
    echo -e "${GREEN}✅ Restauration locale terminée.${NC}"
}

# --- Main ---
INPUT="${1:-}"

# 1) Pas d'argument : prendre le dernier backup dans ./backups/
if [ -z "$INPUT" ]; then
    BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)/backups"
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}📁 Création du dossier backups/ (placez-y un backup_*.tar.gz)${NC}"
        mkdir -p "$BACKUP_DIR"
        echo "Placez un fichier backup_YYYYMMDD_HHMMSS.tar.gz dans: $BACKUP_DIR"
        echo "Puis relancez: $0"
        exit 0
    fi
    LATEST=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -1)
    if [ -z "$LATEST" ]; then
        echo -e "${RED}❌ Aucun fichier backup_*.tar.gz trouvé dans $BACKUP_DIR${NC}"
        exit 1
    fi
    echo -e "${GREEN}📂 Utilisation du backup: $LATEST${NC}"
    TMPDIR=$(mktemp -d)
    trap "rm -rf $TMPDIR" EXIT
    tar -xzf "$LATEST" -C "$TMPDIR"
    # Le dump mongodump crée un sous-dossier avec le nom de la DB (ex: socialhub/)
    RESTORE_DIR=$(find "$TMPDIR" -maxdepth 2 -type d -name "$MONGO_DB" 2>/dev/null | head -1)
    if [ -z "$RESTORE_DIR" ]; then
        RESTORE_DIR=$(ls -d "$TMPDIR"/*/ 2>/dev/null | head -1)
    fi
    if [ -z "$RESTORE_DIR" ] || [ ! -d "$RESTORE_DIR" ]; then
        RESTORE_DIR="$TMPDIR"
    fi
    INPUT="$RESTORE_DIR"
fi

# 2) Argument = fichier .tar.gz
if [ -f "$INPUT" ]; then
    case "$INPUT" in
        *.tar.gz|*.tgz)
            TMPDIR=$(mktemp -d)
            trap "rm -rf $TMPDIR" EXIT
            echo -e "${YELLOW}📦 Décompression de $INPUT...${NC}"
            tar -xzf "$INPUT" -C "$TMPDIR"
            RESTORE_DIR=$(find "$TMPDIR" -maxdepth 2 -type d -name "$MONGO_DB" 2>/dev/null | head -1)
            [ -z "$RESTORE_DIR" ] && RESTORE_DIR=$(ls -d "$TMPDIR"/*/ 2>/dev/null | head -1)
            [ -z "$RESTORE_DIR" ] && RESTORE_DIR="$TMPDIR"
            INPUT="$RESTORE_DIR"
            ;;
        *)
            echo -e "${RED}❌ Fichier non reconnu. Utilisez un .tar.gz ou un dossier de dump.${NC}"
            exit 1
            ;;
    esac
fi

# 3) INPUT doit être un dossier de dump (contenant des .bson ou une sous-dir socialhub/)
if [ ! -d "$INPUT" ]; then
    echo -e "${RED}❌ Dossier introuvable: $INPUT${NC}"
    exit 1
fi

# Si le dossier contient directement une sous-dir au nom de la DB, l'utiliser
if [ -d "$INPUT/$MONGO_DB" ]; then
    INPUT="$INPUT/$MONGO_DB"
fi

echo -e "${GREEN}📂 Dump à restaurer: $INPUT${NC}"
detect_mongo_container

if [ -n "$CONTAINER_NAME" ]; then
    restore_via_docker "$INPUT"
else
    restore_local "$INPUT"
fi

echo ""
echo -e "${GREEN}🎉 Base de données importée avec succès.${NC}"
echo "Redémarrez l'application si besoin: npm run dev"
