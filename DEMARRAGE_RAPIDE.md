# 🚀 Guide de Démarrage Rapide - Windows

## ⚡ Démarrage Automatique (Recommandé)

### Méthode 1 : Script PowerShell (Recommandé)

1. **Double-cliquez sur `start.bat`** ou ouvrez PowerShell et exécutez :
   ```powershell
   .\start.ps1
   ```

2. Le script va automatiquement :
   - ✅ Vérifier Docker
   - ✅ Démarrer MongoDB (Docker)
   - ✅ Démarrer Redis (Docker)
   - ✅ Vérifier la configuration (.env)
   - ✅ Installer les dépendances si nécessaire
   - ✅ Démarrer l'application Next.js

3. **Accédez à l'application** : http://localhost:3000

### Méthode 2 : Commandes manuelles

Si vous préférez démarrer manuellement :

```powershell
# 1. Démarrer MongoDB et Redis
docker-compose up -d

# 2. Vérifier que les services sont démarrés
docker ps

# 3. Démarrer l'application
npm run dev
```

---

## 🛑 Arrêt des Services

### Méthode 1 : Script automatique

Double-cliquez sur `stop.bat` ou exécutez :
```powershell
.\stop.ps1
```

### Méthode 2 : Manuellement

```powershell
# Arrêter les conteneurs Docker
docker-compose stop

# Arrêter Next.js (Ctrl+C dans le terminal)
```

---

## 📋 Prérequis

### 1. Docker Desktop
- Télécharger : https://www.docker.com/products/docker-desktop
- Installer et démarrer Docker Desktop
- Vérifier : `docker --version`

### 2. Node.js (v18 ou supérieur)
- Télécharger : https://nodejs.org/
- Vérifier : `node --version`

### 3. Fichier .env
Le script crée automatiquement `.env` à partir de `env.template` si nécessaire.

---

## 🔧 Configuration Initiale

### 1. Créer le fichier .env

Si le fichier n'existe pas, copiez `env.template` vers `.env` :

```powershell
Copy-Item env.template .env
```

### 2. Configurer MongoDB dans .env

```env
# MongoDB (Docker)
MONGODB_URI=mongodb://localhost:27017/socialhub

# Ou avec authentification Docker
MONGODB_URI=mongodb://admin:admin123@localhost:27017/socialhub?authSource=admin
MONGODB_USERNAME=admin
MONGODB_PASSWORD=admin123
```

---

## ✅ Vérification

### Vérifier que tout fonctionne :

1. **MongoDB** : http://localhost:27017 (ou utiliser MongoDB Compass)
2. **Redis** : Port 6379 (utilisé en interne)
3. **Application** : http://localhost:3000

### Commandes de vérification :

```powershell
# Vérifier les conteneurs Docker
docker ps

# Vérifier les ports
netstat -an | findstr "27017"
netstat -an | findstr "6379"
netstat -an | findstr "3000"
```

---

## 🐛 Dépannage

### Erreur : "Docker n'est pas installé"
**Solution** : Installez Docker Desktop et redémarrez votre ordinateur.

### Erreur : "MongoDB n'a pas démarré"
**Solution** :
```powershell
# Vérifier les logs
docker-compose logs mongo

# Redémarrer
docker-compose restart mongo
```

### Erreur : "Port déjà utilisé"
**Solution** :
```powershell
# Voir quel processus utilise le port
netstat -ano | findstr "27017"
netstat -ano | findstr "3000"

# Arrêter le processus (remplacer PID)
taskkill /PID <PID> /F
```

### Erreur : "MONGODB_URI missing"
**Solution** : Vérifiez que le fichier `.env` existe et contient `MONGODB_URI`.

---

## 📝 Commandes Utiles

### Docker
```powershell
# Voir les conteneurs en cours
docker ps

# Voir les logs MongoDB
docker-compose logs mongo

# Redémarrer MongoDB
docker-compose restart mongo

# Arrêter tous les conteneurs
docker-compose stop

# Supprimer et recréer (⚠️ supprime les données)
docker-compose down -v
docker-compose up -d
```

### Application
```powershell
# Démarrer l'application
npm run dev

# Démarrer le worker de publication
npm run queue

# Démarrer le worker insights
npm run insights

# Installer les dépendances
npm install
```

---

## 🎯 Checklist de Démarrage

Avant de démarrer, vérifiez :

- [ ] Docker Desktop est installé et en cours d'exécution
- [ ] Node.js est installé (v18+)
- [ ] Le fichier `.env` existe (ou sera créé automatiquement)
- [ ] Les ports 27017, 6379 et 3000 sont libres
- [ ] Vous êtes dans le dossier du projet

---

## 🚀 Démarrage Rapide en 3 Étapes

1. **Ouvrez PowerShell** dans le dossier du projet
2. **Exécutez** : `.\start.ps1`
3. **Ouvrez** : http://localhost:3000

C'est tout ! 🎉

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Consultez les logs dans le terminal
2. Vérifiez les logs Docker : `docker-compose logs`
3. Consultez `DEPANNAGE_ERREUR_500.md` pour les erreurs spécifiques
4. Consultez `GUIDE_CONNEXION_DB.md` pour les problèmes de base de données

---

## 💡 Astuces

- **Docker Desktop** doit être démarré avant d'exécuter le script
- Le script **attend automatiquement** que MongoDB soit prêt
- Les **logs** sont affichés directement dans le terminal
- Vous pouvez **garder Docker Desktop ouvert** pour voir l'état des conteneurs

---

**Bon développement ! 🎉**


