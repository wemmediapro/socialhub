#!/bin/bash

echo "🔐 Création de l'utilisateur admin..."

# Méthode 1: Via l'API setup (recommandée)
echo "Tentative via l'API setup..."
curl -X POST https://socialhub.africamediaconnect.fr/api/setup/admin \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# Méthode 2: Via l'API users (alternative)
echo "Tentative via l'API users..."
curl -X POST https://socialhub.africamediaconnect.fr/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User", 
    "email": "admin@mediapro.com",
    "login": "admin",
    "password": "admin123",
    "role": "admin"
  }' \
  -v

echo -e "\n\n"

# Test de login
echo "Test de connexion..."
curl -X POST https://socialhub.africamediaconnect.fr/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mediapro.com",
    "password": "admin123"
  }' \
  -v





