#!/bin/bash

echo "🔍 Test de l'API Facebook - SocialHub Global V5"
echo "================================================"

BASE_URL="https://socialhub.africamediaconnect.fr"

echo ""
echo "1️⃣ Vérification de la configuration Meta..."
echo "--------------------------------------------"
curl -s -X GET "$BASE_URL/api/test/facebook" | jq '.' 2>/dev/null || curl -s -X GET "$BASE_URL/api/test/facebook"

echo ""
echo ""
echo "2️⃣ Liste des comptes connectés..."
echo "----------------------------------"
curl -s -X GET "$BASE_URL/api/accounts" | jq '.' 2>/dev/null || curl -s -X GET "$BASE_URL/api/accounts"

echo ""
echo ""
echo "3️⃣ Test du endpoint de connexion Meta..."
echo "----------------------------------------"
echo "URL de connexion Meta:"
echo "$BASE_URL/api/auth/meta/login"
echo ""
echo "Visitez cette URL dans votre navigateur pour tester la connexion OAuth."

echo ""
echo ""
echo "4️⃣ Instructions de test manuel..."
echo "----------------------------------"
echo "1. Ouvrez votre navigateur"
echo "2. Allez sur: https://socialhub.africamediaconnect.fr/api/auth/meta/login"
echo "3. Connectez-vous avec votre compte Facebook"
echo "4. Autorisez les permissions"
echo "5. Vérifiez que vous êtes redirigé vers votre callback"
echo "6. Relancez ce script pour voir les comptes connectés"





