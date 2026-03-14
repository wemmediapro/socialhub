#!/bin/bash

set -e

echo "🔧 Installation complète de SocialHub Global V5"
echo "================================================"
echo ""

# Chemins relatifs au projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
cd "$PROJECT_DIR"

# 1. Vérifier Node.js
echo "📦 Vérification de Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installé: $NODE_VERSION"
else
    echo "❌ Node.js n'est pas installé"
    echo "   Téléchargez-le depuis: https://nodejs.org/"
    exit 1
fi

# 2. Vérifier npm
echo ""
echo "📦 Vérification de npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm installé: $NPM_VERSION"
else
    echo "❌ npm n'est pas installé"
    exit 1
fi

# 3. Installer les dépendances npm
echo ""
echo "📦 Installation des dépendances npm..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules existe déjà"
else
    echo "   Installation en cours..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dépendances installées"
    else
        echo "❌ Erreur lors de l'installation des dépendances"
        exit 1
    fi
fi

# 4. Vérifier Docker
echo ""
echo "🐳 Vérification de Docker..."
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null 2>&1; then
        echo "✅ Docker est installé et en cours d'exécution"
        DOCKER_AVAILABLE=true
    else
        echo "⚠️  Docker est installé mais n'est pas démarré"
        echo "   Veuillez démarrer Docker Desktop depuis Applications"
        echo "   Puis relancez: ./start-all.sh"
        DOCKER_AVAILABLE=false
    fi
else
    echo "⚠️  Docker n'est pas installé ou n'est pas dans le PATH"
    echo ""
    echo "📥 Pour installer Docker Desktop:"
    echo "   1. Téléchargez depuis: https://www.docker.com/products/docker-desktop"
    echo "   2. Installez Docker Desktop"
    echo "   3. Démarrez Docker Desktop"
    echo "   4. Relancez: ./start-all.sh"
    DOCKER_AVAILABLE=false
fi

# 5. Créer le fichier .env si nécessaire
echo ""
echo "⚙️  Vérification de la configuration..."
if [ -f ".env" ]; then
    echo "✅ Fichier .env existe"
else
    if [ -f "env.template" ]; then
        echo "   Création du fichier .env à partir du template..."
        cp env.template .env
        echo "✅ Fichier .env créé"
        echo "   ⚠️  N'oubliez pas de configurer vos clés API dans .env"
    else
        echo "⚠️  Le fichier env.template n'existe pas"
    fi
fi

# 6. Créer les dossiers nécessaires
echo ""
echo "📁 Création des dossiers nécessaires..."
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/mongodb_data"
mkdir -p "$PROJECT_DIR/public/uploads"
echo "✅ Dossiers créés"

# 7. Corriger les permissions
echo ""
echo "🔐 Correction des permissions..."
chmod +x node_modules/.bin/* 2>/dev/null
chmod +x start-all.sh stop-all.sh 2>/dev/null
echo "✅ Permissions corrigées"

echo ""
echo "=========================================="
echo "✅ Installation terminée !"
echo "=========================================="
echo ""
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "🚀 Pour démarrer tous les services:"
    echo "   ./start-all.sh"
else
    echo "⚠️  Docker n'est pas disponible"
    echo "   Installez et démarrez Docker Desktop, puis:"
    echo "   ./start-all.sh"
fi
echo ""
echo "📱 L'application sera accessible sur: http://localhost:3000"
echo ""

