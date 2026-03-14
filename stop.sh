#!/bin/bash

set -e

echo "🛑 Arrêt de SocialHub Global V5..."
echo ""

# Fonction pour arrêter un service sur un port
stop_service_on_port() {
    local port=$1
    local service_name=$2
    if lsof -ti:"$port" > /dev/null 2>&1; then
        lsof -ti:"$port" | xargs kill -9 2>/dev/null && echo "✅ $service_name arrêté" || echo "⚠️  Erreur lors de l'arrêt de $service_name"
    else
        echo "⚠️  $service_name n'était pas en cours d'exécution"
    fi
}

# Arrêter Next.js
echo "🌐 Arrêt de Next.js..."
if pgrep -f "next dev" > /dev/null; then
    pkill -f "next dev" 2>/dev/null && echo "✅ Next.js arrêté" || echo "⚠️  Erreur lors de l'arrêt de Next.js"
else
    echo "⚠️  Next.js n'était pas en cours d'exécution"
fi

# Arrêter le worker
echo "⚙️  Arrêt du worker..."
if pgrep -f "tsx queue" > /dev/null || pgrep -f "queue/worker" > /dev/null; then
    pkill -f "tsx queue" 2>/dev/null
    pkill -f "queue/worker" 2>/dev/null
    echo "✅ Worker arrêté"
else
    echo "⚠️  Worker n'était pas en cours d'exécution"
fi

# Arrêter MongoDB
echo "📊 Arrêt de MongoDB..."
if pgrep -f "mongod" > /dev/null; then
    pkill -f "mongod" 2>/dev/null && echo "✅ MongoDB arrêté" || echo "⚠️  Erreur lors de l'arrêt de MongoDB"
else
    echo "⚠️  MongoDB n'était pas en cours d'exécution"
fi

# Arrêter Redis
echo "🔄 Arrêt de Redis..."
stop_service_on_port 6379 "Redis"

echo ""
echo "✅ Tous les services sont arrêtés"
