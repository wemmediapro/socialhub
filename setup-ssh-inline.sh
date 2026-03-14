#!/bin/bash
# Script inline pour configurer SSH - Copiez-collez directement dans le terminal

echo "🔐 Configuration SSH pour GitHub"
echo "================================"
echo ""

# Générer la clé SSH
echo "📝 Génération de la clé SSH..."
read -p "Entrez votre email GitHub: " email
ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519 -N ""

# Afficher la clé publique
echo ""
echo "✅ Clé SSH générée!"
echo ""
echo "📋 COPIEZ LA CLÉ CI-DESSOUS:"
echo "=================================="
cat ~/.ssh/id_ed25519.pub
echo "=================================="
echo ""
echo "📝 Étapes suivantes:"
echo "1. Allez sur: https://github.com/settings/keys"
echo "2. Cliquez sur 'New SSH key'"
echo "3. Collez la clé ci-dessus"
echo "4. Cliquez sur 'Add SSH key'"
echo ""
read -p "Appuyez sur Entrée une fois la clé ajoutée sur GitHub..."

# Tester la connexion
echo ""
echo "🔍 Test de la connexion..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ Connexion SSH réussie!"
    
    # Configurer Git
    cd /root/socialhub_global_v5
    git remote set-url origin git@github.com:web483/socialhub_global_v5.git
    echo "✅ Git configuré pour utiliser SSH"
    
    # Tester le pull
    echo ""
    echo "🔍 Test du pull Git..."
    git pull origin main
    echo "✅ Configuration terminée!"
else
    echo "❌ La connexion a échoué"
    echo "Vérifiez que vous avez bien ajouté la clé sur GitHub"
fi

