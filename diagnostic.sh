#!/bin/bash
# Script de diagnostic complet pour le serveur
# SocialHub Global V5

cd ~/socialhub_global_v5 || exit 1

echo "=========================================="
echo "  DIAGNOSTIC COMPLET DU SERVEUR"
echo "=========================================="
echo ""

echo "1. ÉTAT GIT"
echo "-----------"
echo "Dernier commit local :"
git log --oneline -1
echo ""
echo "Récupération des infos GitHub..."
git fetch origin -q 2>/dev/null
echo "Dernier commit GitHub :"
git log origin/main --oneline -1
echo ""
echo "Différences (commits à récupérer) :"
DIFF=$(git log HEAD..origin/main --oneline)
if [ -z "$DIFF" ]; then
    echo "✅ Aucune différence - Git est à jour"
else
    echo "⚠️  Des modifications sont disponibles :"
    echo "$DIFF"
fi
echo ""

echo "2. FICHIERS DE TRADUCTION"
echo "------------------------"
if [ -f "src/i18n/messages/fr.json" ]; then
    LINES=$(wc -l < src/i18n/messages/fr.json 2>/dev/null || echo "0")
    echo "✅ fr.json existe ($LINES lignes)"
else
    echo "❌ fr.json N'EXISTE PAS"
fi

if [ -f "src/i18n/messages/it.json" ]; then
    LINES=$(wc -l < src/i18n/messages/it.json 2>/dev/null || echo "0")
    echo "✅ it.json existe ($LINES lignes)"
else
    echo "❌ it.json N'EXISTE PAS"
fi

if [ -f "src/i18n/TranslationContext.tsx" ]; then
    echo "✅ TranslationContext.tsx existe"
else
    echo "❌ TranslationContext.tsx N'EXISTE PAS"
fi
echo ""

echo "3. CALENDRIER DANS DASHBOARD"
echo "----------------------------"
if grep -q "unifiedCalendar" src/pages/index.tsx 2>/dev/null; then
    COUNT=$(grep -c "unifiedCalendar" src/pages/index.tsx 2>/dev/null || echo "0")
    echo "✅ Calendrier trouvé dans index.tsx ($COUNT occurrences)"
else
    echo "❌ Calendrier NON TROUVÉ dans index.tsx"
fi
echo ""

echo "4. SÉLECTEUR DE LANGUE"
echo "----------------------"
if grep -q "Français\|Italiano" src/components/ModernLayout.tsx 2>/dev/null; then
    echo "✅ Sélecteur de langue trouvé"
else
    echo "❌ Sélecteur de langue NON TROUVÉ"
fi
echo ""

echo "5. BUILD NEXT.JS"
echo "----------------"
if [ -d ".next" ]; then
    echo "✅ Dossier .next existe"
    if [ -f ".next/BUILD_ID" ]; then
        echo "   Build ID : $(cat .next/BUILD_ID 2>/dev/null || echo 'N/A')"
    fi
else
    echo "❌ Dossier .next N'EXISTE PAS (build nécessaire)"
fi
echo ""

echo "6. PM2"
echo "------"
pm2 status 2>/dev/null || echo "PM2 n'est pas installé ou ne fonctionne pas"
echo ""

echo "=========================================="
echo "  RECOMMANDATIONS"
echo "=========================================="
echo ""

# Vérifier si git pull est nécessaire
if [ -n "$DIFF" ]; then
    echo "⚠️  ACTION REQUISE : Faire git pull"
    echo "   Commandes :"
    echo "   cd ~/socialhub_global_v5"
    echo "   git pull origin main"
    echo ""
fi

# Vérifier si les fichiers manquent
if [ ! -f "src/i18n/messages/fr.json" ] || [ ! -f "src/i18n/messages/it.json" ]; then
    echo "⚠️  ACTION REQUISE : Fichiers de traduction manquants"
    echo "   Commandes :"
    echo "   cd ~/socialhub_global_v5"
    echo "   git pull origin main"
    echo "   npm install"
    echo ""
fi

# Vérifier si build est nécessaire
if [ ! -d ".next" ]; then
    echo "⚠️  ACTION REQUISE : Build Next.js nécessaire"
    echo "   Commandes :"
    echo "   cd ~/socialhub_global_v5"
    echo "   npm run build"
    echo ""
fi

echo "=========================================="
echo "  FIN DU DIAGNOSTIC"
echo "=========================================="





