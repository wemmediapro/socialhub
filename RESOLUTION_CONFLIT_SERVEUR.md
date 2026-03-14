# Résolution du Conflit Git sur le Serveur

## 🔴 Problème

Lors du `git pull`, vous avez reçu cette erreur :
```
error: Your local changes to the following files would be overwritten by merge:
backup-mongodb.sh
Please commit your changes or stash them before you merge.
```

## ✅ Solutions

### Solution 1: Sauvegarder et Récupérer (Recommandé)

Cette solution sauvegarde vos modifications locales avant de récupérer les changements distants :

```bash
cd /root/socialhub_global_v5

# Option A: Utiliser le script automatique
chmod +x fix-git-conflict.sh
./fix-git-conflict.sh

# Option B: Manuellement
git stash push -m "Sauvegarde avant pull"
git pull origin main
chmod +x backup-mongodb.sh deploy.sh
```

### Solution 2: Écraser les Modifications Locales

Si vous voulez simplement utiliser la version distante (recommandé car la version distante est corrigée) :

```bash
cd /root/socialhub_global_v5

# Écraser les modifications locales
git checkout -- backup-mongodb.sh
git pull origin main
chmod +x backup-mongodb.sh deploy.sh
```

### Solution 3: Commiter les Modifications Locales

Si vous avez fait des modifications importantes que vous voulez garder :

```bash
cd /root/socialhub_global_v5

# Commiter les modifications locales
git add backup-mongodb.sh
git commit -m "Modifications locales backup"
git pull origin main

# Résoudre les conflits si nécessaire
# Puis:
chmod +x backup-mongodb.sh deploy.sh
```

## 🎯 Recommandation

**Utilisez la Solution 2** car :
- La version distante contient la correction d'authentification MongoDB
- Elle est testée et fonctionnelle
- Vous n'avez probablement pas besoin des modifications locales

## 📝 Après la Résolution

Une fois le conflit résolu, testez le backup :

```bash
./backup-mongodb.sh
```

Le script devrait maintenant fonctionner correctement avec l'authentification MongoDB.

