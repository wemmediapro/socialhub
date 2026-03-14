# 🔧 Guide d'Installation Complète

## ✅ Ce qui a été installé automatiquement

- ✅ Node.js et npm (vérifiés)
- ✅ Dépendances npm (installées)
- ✅ Scripts de démarrage créés
- ✅ Dossiers nécessaires créés
- ✅ Permissions corrigées

## 📋 Prochaines étapes

### 1. Installer Docker Desktop

Docker Desktop est nécessaire pour MongoDB et Redis.

**Option A : Télécharger depuis le site officiel**
1. Allez sur : https://www.docker.com/products/docker-desktop
2. Téléchargez Docker Desktop pour Mac
3. Installez l'application
4. Démarrez Docker Desktop (depuis Applications)

**Option B : Vérifier la compatibilité**
- Votre version de macOS : `sw_vers`
- Docker Desktop nécessite macOS 10.15 ou supérieur

### 2. Démarrer tous les services

Une fois Docker Desktop installé et démarré :

```bash
./start-all.sh
```

Ce script va :
- ✅ Démarrer MongoDB (via Docker)
- ✅ Démarrer Redis (via Docker)
- ✅ Démarrer Next.js
- ✅ Démarrer le worker (si disponible)

### 3. Accéder à l'application

Une fois tous les services démarrés :
- 🌐 Application : http://localhost:3000
- 📊 MongoDB : localhost:27017
- 🔄 Redis : localhost:6379

## 🛑 Arrêter les services

Pour arrêter tous les services :

```bash
./stop-all.sh
```

## 📝 Scripts disponibles

- `install-all.sh` : Installation complète (déjà exécuté)
- `start-all.sh` : Démarre tous les services
- `stop-all.sh` : Arrête tous les services

## ⚠️ Problèmes courants

### Docker n'est pas dans le PATH

Si Docker est installé mais non accessible :

```bash
# Ajouter Docker au PATH
export PATH="/usr/local/bin:$PATH"
```

Ou redémarrer le terminal après l'installation de Docker.

### Ports déjà utilisés

Si les ports 27017, 6379 ou 3000 sont déjà utilisés :

```bash
# Vérifier les ports
lsof -i :27017
lsof -i :6379
lsof -i :3000

# Arrêter les processus si nécessaire
kill -9 <PID>
```

### MongoDB/Redis ne démarrent pas

Vérifiez que Docker Desktop est bien démarré :

```bash
docker ps
```

Si Docker n'est pas accessible, redémarrez Docker Desktop.

## 🎯 État actuel

- ✅ Next.js : Démarré sur http://localhost:3000
- ⚠️ MongoDB : Nécessite Docker
- ⚠️ Redis : Nécessite Docker
- ⚠️ Worker : Fichier manquant (queue/worker.ts)

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans `./logs/`
2. Vérifiez que Docker Desktop est démarré
3. Consultez les fichiers de documentation dans le projet


