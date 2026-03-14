#!/bin/bash
echo "🔍 Vérification des services..."

# Vérifier Docker
echo "📦 Docker services:"
docker-compose ps

# Vérifier MongoDB
echo "🗄️ MongoDB connection:"
docker exec socialhub_global_v5-mongo-1 mongosh -u admin -p admin123 --authenticationDatabase admin --eval "db.adminCommand('listCollections')" 2>/dev/null && echo "✅ MongoDB OK" || echo "❌ MongoDB ERROR"

# Vérifier l'application
echo "🌐 Application:"
curl -s -o /dev/null -w "%{http_code}" https://socialhub.africamediaconnect.fr && echo "✅ App OK" || echo "❌ App ERROR"

# Vérifier PM2
echo "⚡ PM2 status:"
pm2 status
