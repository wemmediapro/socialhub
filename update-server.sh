#!/bin/bash
# Script de mise à jour complète du serveur
# SocialHub Global V5

set -e  # Arrêter en cas d'erreur

echo "🔄 Début de la mise à jour du serveur..."
echo ""

cd ~/socialhub_global_v5 || {
    echo "❌ Erreur : Impossible d'accéder au dossier ~/socialhub_global_v5"
    exit 1
}

echo "📊 Vérification de l'état actuel..."
echo "Dernier commit local :"
git log --oneline -1
echo ""

echo "📦 Sauvegarde des modifications locales (si nécessaire)..."
git stash || true

echo "⬇️  Récupération des modifications depuis GitHub..."
git fetch origin

echo "📋 Comparaison avec GitHub..."
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "✅ Le serveur est déjà à jour !"
    echo "Commit actuel : $LOCAL_COMMIT"
else
    echo "🔄 Mise à jour nécessaire..."
    echo "Local :  $LOCAL_COMMIT"
    echo "Remote : $REMOTE_COMMIT"
    echo ""
    
    echo "📥 Récupération des modifications..."
    git pull origin main || {
        echo "⚠️  Conflit détecté. Résolution..."
        git checkout -- package-lock.json package.json 2>/dev/null || true
        git pull origin main
    }
    
    echo "✅ Modifications récupérées !"
    echo ""
    echo "📦 Installation des dépendances..."
    npm install
    
    echo ""
    echo "🔍 Vérification des vulnérabilités..."
    npm audit || echo "⚠️  Des vulnérabilités peuvent exister"
    
    echo ""
    echo "🔄 Redémarrage de l'application..."
    pm2 restart socialhub-app || {
        echo "⚠️  PM2 ne trouve pas 'socialhub-app'. Démarrage avec ecosystem.config.js..."
        pm2 start ecosystem.config.js || pm2 start npm --name "socialhub-app" -- start
    }
    
    echo ""
    echo "✅ Mise à jour terminée !"
fi

echo ""
echo "📊 Statut final :"
echo "Dernier commit :"
git log --oneline -1
echo ""
echo "Statut PM2 :"
pm2 status
echo ""
echo "📝 Derniers logs (20 lignes) :"
pm2 logs socialhub-app --lines 20 --nostream || echo "⚠️  Impossible de récupérer les logs"

echo ""
echo "✅ Toutes les modifications ont été appliquées !"
echo ""
echo "🔍 Vérifications à faire dans le navigateur :"
echo "   1. Sélecteur de langue visible en haut à droite (🇫🇷 Français / 🇮🇹 Italiano)"
echo "   2. Calendrier visible dans le dashboard (après 'Actions Rapides')"
echo "   3. Changement de langue fonctionne"





