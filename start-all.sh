#!/bin/bash

set -e

echo "🚀 Démarrage complet de SocialHub Global V5..."
echo ""

# Fonction pour vérifier si un port est utilisé
check_port() {
    nc -z localhost "$1" 2>/dev/null
}

# Chemins des installations locales (relatifs au projet)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
MONGODB_BIN="/tmp/mongodb-macos-x86_64-6.0.16/bin/mongod"
REDIS_BIN="$PROJECT_DIR/redis-stable/src/redis-server"
MONGODB_DATA_DIR="$PROJECT_DIR/mongodb_data"
MONGODB_LOG="$MONGODB_DATA_DIR/mongo.log"

# 1. Démarrer MongoDB (local)
echo "📊 Démarrage de MongoDB..."
if check_port 27017; then
    echo "✅ MongoDB est déjà en cours d'exécution"
else
    if [ -f "$MONGODB_BIN" ]; then
        echo "   Démarrage de MongoDB (installation locale)..."
        mkdir -p "$MONGODB_DATA_DIR"
        $MONGODB_BIN \
            --dbpath "$MONGODB_DATA_DIR" \
            --port 27017 \
            --bind_ip 127.0.0.1 \
            --fork \
            --logpath "$MONGODB_LOG" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "   Attente que MongoDB soit prêt..."
            sleep 3
            if check_port 27017; then
                echo "✅ MongoDB est prêt !"
            else
                echo "⚠️  MongoDB pourrait ne pas être complètement prêt, mais continuons..."
            fi
        else
            echo "⚠️  MongoDB pourrait déjà être en cours d'exécution"
        fi
    elif command -v docker &> /dev/null && docker ps &> /dev/null; then
        echo "   Démarrage de MongoDB avec Docker..."
        docker-compose up -d mongo
        sleep 5
        if check_port 27017; then
            echo "✅ MongoDB est prêt !"
        else
            echo "⚠️  MongoDB pourrait ne pas être complètement prêt"
        fi
    else
        echo "❌ MongoDB n'est pas disponible (ni local, ni Docker)"
    fi
fi

# 2. Démarrer Redis (local)
echo ""
echo "🔄 Démarrage de Redis..."
if check_port 6379; then
    echo "✅ Redis est déjà en cours d'exécution"
else
    if [ -f "$REDIS_BIN" ]; then
        echo "   Démarrage de Redis (installation locale)..."
        $REDIS_BIN --daemonize yes 2>/dev/null
        sleep 2
        if check_port 6379; then
            echo "✅ Redis est prêt !"
        else
            echo "⚠️  Redis pourrait ne pas être complètement prêt"
        fi
    elif command -v docker &> /dev/null && docker ps &> /dev/null; then
        echo "   Démarrage de Redis avec Docker..."
        docker-compose up -d redis
        sleep 3
        if check_port 6379; then
            echo "✅ Redis est prêt !"
        else
            echo "⚠️  Redis pourrait ne pas être complètement prêt"
        fi
    else
        echo "❌ Redis n'est pas disponible (ni local, ni Docker)"
    fi
fi

# 3. Vérifier et démarrer Next.js
echo ""
echo "🌐 Vérification de Next.js..."
if check_port 3000; then
    echo "✅ Next.js est déjà en cours d'exécution"
else
    echo "   Démarrage de Next.js..."
    mkdir -p "$PROJECT_DIR/logs"
    cd "$PROJECT_DIR"
    npm run dev > logs/next.log 2>&1 &
    sleep 5
    if check_port 3000; then
        echo "✅ Next.js est prêt !"
    else
        echo "⚠️  Next.js est en cours de démarrage..."
    fi
fi

# 4. Démarrer le worker (si le dossier existe)
echo ""
echo "⚙️  Vérification du worker..."
if [ -d "$PROJECT_DIR/queue" ] && [ -f "$PROJECT_DIR/queue/worker.ts" ]; then
    if pgrep -f "queue/worker" > /dev/null; then
        echo "✅ Worker est déjà en cours d'exécution"
    else
        echo "   Démarrage du worker..."
        cd "$PROJECT_DIR"
        npm run queue > logs/queue.log 2>&1 &
        echo "✅ Worker démarré !"
    fi
else
    echo "⚠️  Le dossier queue/ n'existe pas, le worker ne peut pas démarrer"
fi

echo ""
echo "=========================================="
echo "✅ Tous les services sont démarrés !"
echo "=========================================="
echo ""
echo "📱 Application: http://localhost:3000"
echo "📊 MongoDB: localhost:27017"
echo "🔄 Redis: localhost:6379"
echo ""
echo "📝 Logs disponibles dans ./logs/"
echo ""
echo "Pour arrêter: ./stop-all.sh"
echo ""

