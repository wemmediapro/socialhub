#!/bin/bash

# Script pour résoudre les conflits Git et faire le pull
# Usage: ./fix-git-pull.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Résolution des conflits Git et pull...${NC}"
echo "=========================================="
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté dans /root/socialhub_global_v5${NC}"
    exit 1
fi

# Afficher le statut actuel
echo -e "${YELLOW}📊 Statut Git actuel:${NC}"
git status --short
echo ""

# Écraser les modifications locales des fichiers en conflit
echo -e "${YELLOW}🔄 Écrasement des modifications locales...${NC}"
git checkout -- backup-mongodb.sh deploy.sh 2>/dev/null || true

# Vérifier s'il reste d'autres modifications
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}💾 Sauvegarde des autres modifications locales...${NC}"
    git stash push -m "Sauvegarde avant pull - $(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
fi

# Faire le pull
echo -e "${YELLOW}📥 Récupération des dernières modifications...${NC}"
if git pull origin main; then
    echo -e "${GREEN}✅ Pull réussi!${NC}"
else
    echo -e "${RED}❌ Le pull a échoué${NC}"
    exit 1
fi

# Rendre les scripts exécutables
echo ""
echo -e "${YELLOW}⚙️  Configuration des permissions...${NC}"
chmod +x backup-mongodb.sh deploy.sh setup-ssh-github.sh fix-git-pull.sh 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Terminé avec succès!${NC}"
echo ""
echo -e "${GREEN}📋 Fichiers mis à jour:${NC}"
git log --oneline -1
echo ""

