#!/bin/bash

set -e

echo "🚀 Démarrage de SocialHub Global V5..."
echo ""

# Chemins relatifs au projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
MONGODB_BIN="/tmp/mongodb-macos-x86_64-6.0.16/bin/mongod"
REDIS_BIN="$PROJECT_DIR/redis-stable/src/redis-server"
MONGODB_DATA_DIR="$PROJECT_DIR/mongodb_data"
MONGODB_LOG="$MONGODB_DATA_DIR/mongo.log"

# Fonction pour vérifier si un port est utilisé
check_port() {
    nc -z localhost "$1" 2>/dev/null
}

# Vérifier si MongoDB est déjà en cours
if ! check_port 27017; then
    echo "📦 Démarrage de MongoDB..."
    if [ -f "$MONGODB_BIN" ]; then
        mkdir -p "$MONGODB_DATA_DIR"
        "$MONGODB_BIN" \
            --dbpath "$MONGODB_DATA_DIR" \
            --port 27017 \
            --bind_ip 127.0.0.1 \
            --fork \
            --logpath "$MONGODB_LOG" 2>/dev/null
        sleep 2
        echo "✅ MongoDB démarré"
    else
        echo "⚠️  MongoDB binaire non trouvé à $MONGODB_BIN"
    fi
else
    echo "✅ MongoDB est déjà en cours d'exécution"
fi

# Vérifier si Redis est en cours
if ! check_port 6379; then
    echo "📦 Démarrage de Redis..."
    if [ -f "$REDIS_BIN" ]; then
        "$REDIS_BIN" --daemonize yes 2>/dev/null
        sleep 2
        echo "✅ Redis démarré"
    elif command -v brew &> /dev/null; then
        brew services start redis 2>/dev/null || echo "⚠️  Impossible de démarrer Redis via Homebrew"
        sleep 2
    else
        echo "⚠️  Redis n'est pas disponible"
    fi
else
    echo "✅ Redis est déjà en cours d'exécution"
fi

# Démarrer Next.js
echo "🌐 Démarrage de Next.js..."
cd "$PROJECT_DIR"
mkdir -p logs
npm run dev > logs/next.log 2>&1 &

# Attendre que Next.js soit prêt
sleep 5

# Démarrer le worker
if [ -d "$PROJECT_DIR/queue" ] && [ -f "$PROJECT_DIR/queue/worker.ts" ]; then
    echo "⚙️  Démarrage du worker de publication..."
    npm run queue > logs/queue.log 2>&1 &
    echo "✅ Worker démarré"
else
    echo "⚠️  Le dossier queue/ n'existe pas, le worker ne peut pas démarrer"
fi

echo ""
echo "✅ Tous les services sont démarrés !"
echo ""
echo "📱 Application: http://localhost:3000"
echo "📊 MongoDB: localhost:27017"
echo "🔄 Redis: localhost:6379"
echo ""
echo "📝 Logs disponibles dans ./logs/"
echo ""
echo "Pour arrêter: ./stop.sh"
