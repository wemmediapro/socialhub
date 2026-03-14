#!/bin/bash

# Script pour configurer SSH pour GitHub
# Usage: ./setup-ssh-github.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Configuration SSH pour GitHub${NC}"
echo "=================================="
echo ""

# Vérifier si une clé existe déjà
if [ -f ~/.ssh/id_ed25519 ] || [ -f ~/.ssh/id_rsa ]; then
    echo -e "${YELLOW}ℹ️  Une clé SSH existe déjà${NC}"
    read -p "Voulez-vous en générer une nouvelle? (o/n): " generate_new
    
    if [ "$generate_new" != "o" ] && [ "$generate_new" != "O" ]; then
        echo -e "${GREEN}✅ Utilisation de la clé existante${NC}"
        if [ -f ~/.ssh/id_ed25519 ]; then
            KEY_FILE=~/.ssh/id_ed25519
        else
            KEY_FILE=~/.ssh/id_rsa
        fi
    else
        KEY_FILE=~/.ssh/id_ed25519
        echo -e "${YELLOW}📝 Génération d'une nouvelle clé...${NC}"
        read -p "Entrez votre email GitHub: " email
        ssh-keygen -t ed25519 -C "$email" -f "$KEY_FILE" -N ""
    fi
else
    KEY_FILE=~/.ssh/id_ed25519
    echo -e "${YELLOW}📝 Génération d'une nouvelle clé SSH...${NC}"
    read -p "Entrez votre email GitHub: " email
    ssh-keygen -t ed25519 -C "$email" -f "$KEY_FILE" -N ""
fi

# Afficher la clé publique
echo ""
echo -e "${GREEN}✅ Clé SSH générée/configurée${NC}"
echo ""
echo -e "${YELLOW}📋 Votre clé publique SSH:${NC}"
echo "=================================="
cat "${KEY_FILE}.pub"
echo "=================================="
echo ""

# Instructions pour ajouter sur GitHub
echo -e "${YELLOW}📝 Étapes suivantes:${NC}"
echo "1. Copiez la clé publique ci-dessus"
echo "2. Allez sur: https://github.com/settings/keys"
echo "3. Cliquez sur 'New SSH key'"
echo "4. Collez la clé et sauvegardez"
echo ""
read -p "Appuyez sur Entrée une fois que vous avez ajouté la clé sur GitHub..."

# Tester la connexion
echo ""
echo -e "${YELLOW}🔍 Test de la connexion SSH...${NC}"
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo -e "${GREEN}✅ Connexion SSH réussie!${NC}"
else
    echo -e "${RED}❌ La connexion a échoué${NC}"
    echo -e "${YELLOW}⚠️  Vérifiez que vous avez bien ajouté la clé sur GitHub${NC}"
    echo ""
    echo "Testez manuellement avec:"
    echo "  ssh -T git@github.com"
    exit 1
fi

# Configurer Git pour utiliser SSH
echo ""
echo -e "${YELLOW}⚙️  Configuration de Git pour utiliser SSH...${NC}"
cd /root/socialhub_global_v5 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Le dossier /root/socialhub_global_v5 n'existe pas${NC}"
    echo -e "${YELLOW}   Configurez manuellement avec:${NC}"
    echo "   git remote set-url origin git@github.com:web483/socialhub_global_v5.git"
    exit 0
}

git remote set-url origin git@github.com:web483/socialhub_global_v5.git
echo -e "${GREEN}✅ Git configuré pour utiliser SSH${NC}"

# Tester le pull
echo ""
echo -e "${YELLOW}🔍 Test du pull Git...${NC}"
if git pull origin main 2>&1 | grep -q -E "(Already up to date|Updating|Fast-forward)"; then
    echo -e "${GREEN}✅ Pull Git réussi!${NC}"
else
    echo -e "${YELLOW}⚠️  Le pull a peut-être échoué, mais la configuration SSH est correcte${NC}"
    echo "   Vous pouvez essayer manuellement: git pull origin main"
fi

echo ""
echo -e "${GREEN}🎉 Configuration terminée!${NC}"
echo ""
echo -e "${GREEN}✅ Vous pouvez maintenant utiliser:${NC}"
echo "  - git pull origin main (fonctionnera automatiquement)"
echo "  - ./deploy.sh (fera des pulls automatiques)"
echo ""

