# 🔌 Guide de Connexion à la Base de Données MongoDB

## 📋 Vue d'ensemble

Ce projet utilise **MongoDB** comme base de données. La connexion est configurée dans `src/lib/db.ts` et utilise la variable d'environnement `MONGODB_URI`.

---

## 🐳 Option 1 : Docker (Recommandé - Windows)

### Prérequis
- Docker Desktop installé sur Windows
- Docker Desktop doit être en cours d'exécution

### Étapes

1. **Démarrer MongoDB avec Docker Compose**
   ```bash
   docker-compose up -d mongo
   ```

2. **Vérifier que MongoDB est démarré**
   ```bash
   docker ps
   ```
   Vous devriez voir le conteneur `mongo` en cours d'exécution.

3. **Créer le fichier `.env`** (si pas déjà présent)
   ```bash
   # Copier le template
   copy env.template .env
   ```

4. **Configurer la connexion MongoDB dans `.env`**
   ```env
   # MongoDB (avec authentification Docker)
   MONGODB_URI=mongodb://admin:admin123@localhost:27017/socialhub?authSource=admin
   
   # Ou sans authentification (si vous avez modifié docker-compose.yml)
   MONGODB_URI=mongodb://localhost:27017/socialhub
   ```

5. **Si vous utilisez l'authentification Docker**, ajoutez aussi :
   ```env
   MONGODB_USERNAME=admin
   MONGODB_PASSWORD=admin123
   ```

6. **Tester la connexion**
   ```bash
   npm run dev
   ```
   L'application devrait démarrer et se connecter automatiquement à MongoDB.

---

## 💻 Option 2 : MongoDB Local (Windows)

### Installation

1. **Télécharger MongoDB Community Server**
   - Aller sur : https://www.mongodb.com/try/download/community
   - Sélectionner : Windows, MSI
   - Installer avec les options par défaut

2. **Démarrer MongoDB**
   - MongoDB s'installe généralement comme service Windows
   - Vérifier dans les Services Windows qu'il est démarré
   - Ou démarrer manuellement :
     ```bash
     net start MongoDB
     ```

3. **Configurer `.env`**
   ```env
   # MongoDB local (sans authentification)
   MONGODB_URI=mongodb://localhost:27017/socialhub
   ```

---

## ☁️ Option 3 : MongoDB Atlas (Cloud)

### Avantages
- ✅ Pas d'installation locale
- ✅ Accès depuis n'importe où
- ✅ Gratuit jusqu'à 512 MB

### Étapes

1. **Créer un compte sur MongoDB Atlas**
   - https://www.mongodb.com/cloud/atlas

2. **Créer un cluster gratuit (M0)**

3. **Configurer l'accès réseau**
   - Aller dans "Network Access"
   - Ajouter votre IP (ou `0.0.0.0/0` pour toutes les IPs - développement uniquement)

4. **Créer un utilisateur de base de données**
   - Aller dans "Database Access"
   - Créer un utilisateur avec un mot de passe

5. **Obtenir la chaîne de connexion**
   - Aller dans "Database" → "Connect"
   - Choisir "Connect your application"
   - Copier la chaîne de connexion (format : `mongodb+srv://...`)

6. **Configurer `.env`**
   ```env
   # MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/socialhub?retryWrites=true&w=majority
   ```

---

## 🔧 Configuration Avancée

### Authentification personnalisée

Si vous avez configuré MongoDB avec des identifiants personnalisés :

```env
MONGODB_URI=mongodb://localhost:27017/socialhub
MONGODB_USERNAME=votre_username
MONGODB_PASSWORD=votre_password
```

Le code dans `src/lib/db.ts` utilisera automatiquement ces identifiants.

### Plusieurs bases de données

Pour utiliser une base de données différente, modifiez simplement le nom dans l'URI :

```env
MONGODB_URI=mongodb://localhost:27017/ma_nouvelle_db
```

---

## 🧪 Tester la Connexion

### Méthode 1 : Via l'application
1. Démarrer l'application : `npm run dev`
2. Si la connexion réussit, l'application démarre normalement
3. Si elle échoue, vous verrez une erreur dans la console

### Méthode 2 : Via MongoDB Compass (GUI)
1. Télécharger MongoDB Compass : https://www.mongodb.com/products/compass
2. Se connecter avec l'URI de votre `.env`
3. Vérifier que la base de données `socialhub` existe

### Méthode 3 : Via ligne de commande (mongosh)
```bash
# Se connecter à MongoDB
mongosh "mongodb://localhost:27017/socialhub"

# Ou avec authentification
mongosh "mongodb://admin:admin123@localhost:27017/socialhub?authSource=admin"

# Lister les bases de données
show dbs

# Utiliser la base socialhub
use socialhub

# Lister les collections
show collections
```

---

## ❌ Résolution des Problèmes

### Erreur : "MONGODB_URI missing"
**Solution** : Vérifiez que le fichier `.env` existe et contient `MONGODB_URI`

### Erreur : "ECONNREFUSED" ou "Cannot connect"
**Solutions** :
1. Vérifiez que MongoDB est démarré :
   - Docker : `docker ps` (doit afficher le conteneur mongo)
   - Local : Vérifier dans les Services Windows
2. Vérifiez le port : MongoDB utilise le port `27017` par défaut
3. Vérifiez l'URI dans `.env`

### Erreur : "Authentication failed"
**Solutions** :
1. Vérifiez les identifiants dans `.env`
2. Si vous utilisez Docker, vérifiez les identifiants dans `docker-compose.yml`
3. Vérifiez que `authSource=admin` est présent dans l'URI si nécessaire

### Erreur : "Database name required"
**Solution** : Assurez-vous que l'URI contient le nom de la base de données :
```
✅ mongodb://localhost:27017/socialhub
❌ mongodb://localhost:27017
```

---

## 📝 Exemple de fichier `.env` complet

```env
# Node Environment
NODE_ENV=development

# Application
PORT=3000
APP_URL=http://localhost:3000

# ============================================
# Database Configuration
# ============================================

# MongoDB (Docker)
MONGODB_URI=mongodb://admin:admin123@localhost:27017/socialhub?authSource=admin
MONGODB_USERNAME=admin
MONGODB_PASSWORD=admin123

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# ============================================
# Autres configurations...
# ============================================
```

---

## 🚀 Commandes Utiles

### Docker
```bash
# Démarrer MongoDB
docker-compose up -d mongo

# Arrêter MongoDB
docker-compose stop mongo

# Voir les logs MongoDB
docker-compose logs mongo

# Redémarrer MongoDB
docker-compose restart mongo

# Supprimer et recréer (⚠️ supprime les données)
docker-compose down -v
docker-compose up -d mongo
```

### MongoDB Local
```bash
# Démarrer le service
net start MongoDB

# Arrêter le service
net stop MongoDB

# Vérifier le statut
sc query MongoDB
```

---

## 📚 Ressources

- [Documentation MongoDB](https://docs.mongodb.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [Docker Hub - MongoDB](https://hub.docker.com/_/mongo)

---

## ✅ Checklist de Connexion

- [ ] MongoDB est installé/démarré (Docker ou local)
- [ ] Le fichier `.env` existe à la racine du projet
- [ ] `MONGODB_URI` est configuré dans `.env`
- [ ] Le port 27017 est accessible
- [ ] Les identifiants sont corrects (si authentification)
- [ ] L'application démarre sans erreur de connexion
- [ ] La base de données `socialhub` est créée automatiquement

---

**Note** : La connexion à MongoDB est automatique au démarrage de l'application. Le code dans `src/lib/db.ts` gère la connexion avec un système de cache pour éviter les reconnexions multiples.


