#!/bin/bash

# Script pour résoudre les conflits Git sur le serveur
# Usage: ./fix-git-conflict.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Résolution des conflits Git...${NC}"
echo "=================================="
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté dans le dossier de l'application${NC}"
    exit 1
fi

# Afficher le statut Git
echo -e "${YELLOW}📊 Statut Git actuel:${NC}"
git status --short
echo ""

# Sauvegarder les modifications locales si nécessaire
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}💾 Sauvegarde des modifications locales...${NC}"
    git stash push -m "Sauvegarde avant pull - $(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Modifications sauvegardées${NC}"
    echo ""
fi

# Récupérer les dernières modifications
echo -e "${YELLOW}📥 Récupération des dernières modifications...${NC}"
git pull origin main || git pull origin master

echo ""
echo -e "${GREEN}✅ Conflits résolus avec succès!${NC}"
echo ""

# Afficher les fichiers modifiés
echo -e "${YELLOW}📋 Fichiers mis à jour:${NC}"
git log --oneline -1
echo ""

# Vérifier si le script de backup existe et le rendre exécutable
if [ -f "backup-mongodb.sh" ]; then
    chmod +x backup-mongodb.sh
    echo -e "${GREEN}✅ backup-mongodb.sh est maintenant exécutable${NC}"
fi

if [ -f "deploy.sh" ]; then
    chmod +x deploy.sh
    echo -e "${GREEN}✅ deploy.sh est maintenant exécutable${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Terminé! Vous pouvez maintenant utiliser:${NC}"
echo "  - ./backup-mongodb.sh pour faire un backup"
echo "  - ./deploy.sh pour déployer"
echo ""

