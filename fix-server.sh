#!/bin/bash
# Script de résolution de conflit Git sur le serveur
# SocialHub Global V5

echo "🔧 Résolution du conflit Git..."
echo ""

cd ~/socialhub_global_v5 || exit 1

echo "📦 Écrasement du package-lock.json local..."
git checkout -- package-lock.json package.json

echo "⬇️  Récupération des modifications..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du pull. Essayez: git stash puis git pull origin main"
    exit 1
fi

echo "📦 Installation des dépendances..."
npm install

echo "🔍 Vérification des vulnérabilités..."
npm audit

echo ""
echo "✅ Mise à jour terminée !"
echo ""
echo "🔄 Redémarrer l'application avec:"
echo "   pm2 restart socialhub"
echo "   ou"
echo "   npm run build && npm start"
echo ""

