#!/bin/bash
# Script de mise à jour forcée du serveur
# SocialHub Global V5

set -e  # Arrêter en cas d'erreur

echo "🔄 MISE À JOUR FORCÉE DU SERVEUR"
echo "=================================="
echo ""

cd ~/socialhub_global_v5 || {
    echo "❌ Erreur : Impossible d'accéder au dossier"
    exit 1
}

echo "📊 ÉTAPE 1 : Vérification de l'état actuel"
echo "-------------------------------------------"
echo "Dernier commit local :"
git log --oneline -1 || echo "Aucun commit"
echo ""

echo "⬇️  ÉTAPE 2 : Récupération des modifications"
echo "-------------------------------------------"
# Sauvegarder les modifications locales
git stash || true

# Récupérer depuis GitHub
git fetch origin

# Forcer la mise à jour
git reset --hard origin/main

echo "✅ Dernier commit après mise à jour :"
git log --oneline -1
echo ""

echo "📦 ÉTAPE 3 : Installation des dépendances"
echo "-------------------------------------------"
npm install
echo ""

echo "🔨 ÉTAPE 4 : BUILD NEXT.JS (IMPORTANT !)"
echo "-------------------------------------------"
echo "⚠️  Next.js nécessite un build pour voir les modifications"
npm run build
echo ""

echo "🔄 ÉTAPE 5 : Redémarrage de l'application"
echo "-------------------------------------------"
# Arrêter l'application si elle tourne
pm2 stop socialhub-app 2>/dev/null || true

# Démarrer avec ecosystem.config.js ou directement
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    pm2 start npm --name "socialhub-app" -- start
fi

# Sauvegarder la configuration PM2
pm2 save || true
echo ""

echo "📊 ÉTAPE 6 : Vérification"
echo "-------------------------------------------"
echo "Statut PM2 :"
pm2 status
echo ""
echo "Derniers logs :"
pm2 logs socialhub-app --lines 20 --nostream || echo "Logs non disponibles"
echo ""

echo "✅ VÉRIFICATION DES FICHIERS"
echo "-------------------------------------------"
if [ -f "src/i18n/messages/fr.json" ]; then
    echo "✅ fr.json : $(wc -l < src/i18n/messages/fr.json) lignes"
else
    echo "❌ fr.json manquant"
fi

if [ -f "src/i18n/messages/it.json" ]; then
    echo "✅ it.json : $(wc -l < src/i18n/messages/it.json) lignes"
else
    echo "❌ it.json manquant"
fi

if grep -q "unifiedCalendar" src/pages/index.tsx 2>/dev/null; then
    echo "✅ Calendrier présent dans index.tsx"
else
    echo "❌ Calendrier manquant dans index.tsx"
fi

if grep -q "Français\|Italiano" src/components/ModernLayout.tsx 2>/dev/null; then
    echo "✅ Sélecteur de langue présent"
else
    echo "❌ Sélecteur de langue manquant"
fi
echo ""

echo "=================================="
echo "✅ MISE À JOUR TERMINÉE"
echo "=================================="
echo ""
echo "🔍 Vérifications à faire :"
echo "   1. Ouvrir l'application dans le navigateur"
echo "   2. Vérifier le sélecteur de langue (en haut à droite)"
echo "   3. Vérifier le calendrier (dans le dashboard, après Actions Rapides)"
echo "   4. Changer la langue et vérifier que tout change"
echo ""





