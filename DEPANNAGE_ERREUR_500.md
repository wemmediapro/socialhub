# 🔧 Dépannage - Erreur 500 lors de la création d'un post

## ❌ Problème
Erreur "Request failed with status code 500" lors de la création d'un nouveau post.

## 🔍 Causes possibles

### 1. **MongoDB n'est pas connecté** ⚠️ (Cause la plus probable)

**Symptômes** :
- Erreur 500 dans la console
- Message "Database connection failed" dans les logs serveur

**Solution** :
1. Vérifier que MongoDB est démarré :
   ```bash
   # Avec Docker
   docker ps
   # Vous devriez voir un conteneur "mongo" en cours d'exécution
   
   # Si pas démarré :
   docker-compose up -d mongo
   ```

2. Vérifier le fichier `.env` à la racine du projet :
   ```env
   MONGODB_URI=mongodb://localhost:27017/socialhub
   # Ou avec authentification Docker :
   MONGODB_URI=mongodb://admin:admin123@localhost:27017/socialhub?authSource=admin
   MONGODB_USERNAME=admin
   MONGODB_PASSWORD=admin123
   ```

3. Redémarrer l'application :
   ```bash
   npm run dev
   ```

---

### 2. **Le projectId "DEMO" n'existe pas**

**Symptômes** :
- L'erreur se produit uniquement lors de la création
- Message "Validation error" ou "Database error"

**Solution** :
1. Créer un projet réel dans l'application :
   - Aller sur `/projects`
   - Cliquer sur "Nouveau Projet"
   - Créer un projet avec un nom

2. OU modifier le code pour utiliser un projectId existant :
   - Dans `src/pages/posts/new.tsx`, le code charge automatiquement le premier projet disponible
   - Si aucun projet n'existe, créer un projet d'abord

---

### 3. **Données manquantes ou invalides**

**Symptômes** :
- Erreur de validation Zod
- Message "Validation error" avec détails

**Solution** :
Vérifier que tous les champs requis sont remplis :
- ✅ Au moins un réseau social sélectionné (Instagram, Facebook, TikTok)
- ✅ Type de contenu sélectionné (Post, Story, Reel, Carousel)
- ✅ Date de publication valide
- ✅ ProjectId valide (pas "DEMO" si aucun projet n'existe)

---

### 4. **Problème avec l'upload de fichiers**

**Symptômes** :
- Erreur lors de l'upload d'une image/vidéo
- Message "Upload failed"

**Solution** :
1. Vérifier que le dossier `public/uploads` existe :
   ```bash
   # Créer le dossier s'il n'existe pas
   mkdir -p public/uploads
   ```

2. Vérifier les permissions d'écriture sur Windows
3. Vérifier la taille du fichier (max 10MB par défaut)

---

## 🧪 Test de diagnostic

### Étape 1 : Vérifier MongoDB
```bash
# Tester la connexion MongoDB
mongosh "mongodb://localhost:27017/socialhub"

# Ou avec Docker
docker exec -it <container_id> mongosh "mongodb://localhost:27017/socialhub"
```

### Étape 2 : Vérifier les logs serveur
Regardez la console du serveur Next.js (terminal où vous avez lancé `npm run dev`) pour voir l'erreur exacte.

Les nouveaux logs devraient maintenant afficher :
- `"Creating post with data:"` - Les données envoyées
- `"Database connection error:"` - Si MongoDB échoue
- `"Error creating post:"` - L'erreur détaillée

### Étape 3 : Tester l'API directement
```bash
# Test avec curl (PowerShell)
curl -X POST http://localhost:3000/api/posts `
  -H "Content-Type: application/json" `
  -d '{
    "projectId": "DEMO",
    "networks": ["instagram"],
    "type": "post",
    "caption": "Test",
    "scheduledAt": "2025-11-05T10:00:00Z"
  }'
```

---

## 🛠️ Solutions rapides

### Solution 1 : Redémarrer tous les services
```bash
# Arrêter
docker-compose down
npm run dev # Arrêter avec Ctrl+C

# Redémarrer
docker-compose up -d mongo
npm run dev
```

### Solution 2 : Vérifier le fichier .env
Assurez-vous que le fichier `.env` existe et contient :
```env
MONGODB_URI=mongodb://localhost:27017/socialhub
```

### Solution 3 : Créer un projet d'abord
1. Aller sur `/projects`
2. Créer un nouveau projet
3. Retourner sur `/posts/new`
4. Le projet sera automatiquement sélectionné

---

## 📝 Checklist de vérification

- [ ] MongoDB est démarré (`docker ps` ou service Windows)
- [ ] Le fichier `.env` existe à la racine du projet
- [ ] `MONGODB_URI` est correctement configuré dans `.env`
- [ ] Au moins un projet existe dans la base de données
- [ ] Le dossier `public/uploads` existe (si vous uploadez des fichiers)
- [ ] Les logs serveur sont consultés pour voir l'erreur exacte
- [ ] L'application a été redémarrée après modification de `.env`

---

## 🔍 Logs à consulter

### Console du serveur Next.js
Regardez le terminal où vous avez lancé `npm run dev`. Vous devriez voir :
- Les erreurs de connexion MongoDB
- Les erreurs de validation
- Les erreurs de création de post

### Console du navigateur (F12)
Ouvrez les outils de développement (F12) et regardez l'onglet "Console" pour voir les erreurs côté client.

### Logs MongoDB (si Docker)
```bash
docker-compose logs mongo
```

---

## 💡 Améliorations apportées

J'ai amélioré le code pour :
1. ✅ Meilleure gestion des erreurs avec messages détaillés
2. ✅ Logs de débogage pour identifier le problème
3. ✅ Gestion spécifique des erreurs MongoDB
4. ✅ Gestion spécifique des erreurs de validation Zod
5. ✅ Vérification de la connexion MongoDB avant traitement

---

## 📞 Si le problème persiste

1. **Consultez les logs serveur** - Ils contiennent maintenant plus d'informations
2. **Vérifiez la console du navigateur** (F12) pour voir les erreurs côté client
3. **Vérifiez que MongoDB fonctionne** avec `mongosh` ou MongoDB Compass
4. **Créez un projet** avant de créer un post si vous n'en avez pas

---

## 🎯 Prochaines étapes

Après avoir appliqué les corrections :
1. Redémarrez l'application : `npm run dev`
2. Essayez de créer un post à nouveau
3. Consultez les logs serveur pour voir l'erreur exacte
4. Partagez les logs si le problème persiste


