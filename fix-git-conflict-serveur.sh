#!/bin/bash

# Script pour résoudre les conflits Git sur le serveur
# Usage: ./fix-git-conflict-serveur.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Résolution des conflits Git sur le serveur...${NC}"
echo "=============================================="
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté dans le dossier de l'application${NC}"
    echo -e "${YELLOW}   Exécutez: cd /root/socialhub_global_v5${NC}"
    exit 1
fi

# Afficher le statut Git
echo -e "${YELLOW}📊 Statut Git actuel:${NC}"
git status --short
echo ""

# Écraser les modifications locales avec la version distante (recommandé)
echo -e "${YELLOW}🔄 Écrasement des modifications locales avec la version distante...${NC}"
echo -e "${YELLOW}   (Les fichiers distants contiennent les corrections de chemins)${NC}"
echo ""

# Écraser les fichiers en conflit
if [ -f "backup-mongodb.sh" ]; then
    git checkout -- backup-mongodb.sh
    echo -e "${GREEN}✅ backup-mongodb.sh restauré${NC}"
fi

if [ -f "deploy.sh" ]; then
    git checkout -- deploy.sh
    echo -e "${GREEN}✅ deploy.sh restauré${NC}"
fi

# Récupérer les dernières modifications
echo ""
echo -e "${YELLOW}📥 Récupération des dernières modifications...${NC}"
git pull origin main || git pull origin master

echo ""
echo -e "${GREEN}✅ Conflits résolus avec succès!${NC}"
echo ""

# Afficher les fichiers modifiés
echo -e "${YELLOW}📋 Derniers commits:${NC}"
git log --oneline -3
echo ""

# Rendre les scripts exécutables
if [ -f "backup-mongodb.sh" ]; then
    chmod +x backup-mongodb.sh
    echo -e "${GREEN}✅ backup-mongodb.sh est maintenant exécutable${NC}"
fi

if [ -f "deploy.sh" ]; then
    chmod +x deploy.sh
    echo -e "${GREEN}✅ deploy.sh est maintenant exécutable${NC}"
fi

if [ -f "fix-git-conflict.sh" ]; then
    chmod +x fix-git-conflict.sh
    echo -e "${GREEN}✅ fix-git-conflict.sh est maintenant exécutable${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Terminé! Vous pouvez maintenant utiliser:${NC}"
echo "  - ./backup-mongodb.sh pour faire un backup"
echo "  - ./deploy.sh pour déployer"
echo ""

