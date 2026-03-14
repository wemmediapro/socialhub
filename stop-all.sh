#!/bin/bash

set -e

echo "🛑 Arrêt de tous les services..."
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
stop_service_on_port 3000 "Next.js"

# Arrêter le worker
echo "⚙️  Arrêt du worker..."
if pgrep -f "queue/worker" > /dev/null; then
    pkill -f "queue/worker" 2>/dev/null && echo "✅ Worker arrêté" || echo "⚠️  Erreur lors de l'arrêt du worker"
else
    echo "⚠️  Worker n'était pas en cours d'exécution"
fi

# Arrêter MongoDB
echo ""
echo "📊 Arrêt de MongoDB..."
stop_service_on_port 27017 "MongoDB"

# Arrêter Redis
echo ""
echo "🔄 Arrêt de Redis..."
stop_service_on_port 6379 "Redis"
# Aussi arrêter via redis-cli si disponible
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/redis-stable/src/redis-cli" ]; then
    "$SCRIPT_DIR/redis-stable/src/redis-cli" shutdown 2>/dev/null || true
fi

# Arrêter les conteneurs Docker (si utilisés)
if command -v docker &> /dev/null && docker ps &> /dev/null 2>&1; then
    echo ""
    echo "🐳 Arrêt des conteneurs Docker..."
    docker-compose stop 2>/dev/null && echo "✅ Conteneurs Docker arrêtés" || echo "⚠️  Aucun conteneur à arrêter"
fi

echo ""
echo "✅ Tous les services sont arrêtés !"

