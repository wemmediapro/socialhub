# 🔧 Résolution Rapide du Conflit Git

## 🔴 Problème Actuel

Vous avez cette erreur lors de `git pull` :
```
error: Your local changes to the following files would be overwritten by merge:
backup-mongodb.sh
deploy.sh
Please commit your changes or stash them before you merge.
```

## ✅ Solution Rapide (Recommandée)

Sur le serveur, exécutez ces commandes :

```bash
cd /root/socialhub_global_v5

# Écraser les modifications locales avec la version distante
git checkout -- backup-mongodb.sh
git checkout -- deploy.sh

# Récupérer les dernières modifications
git pull origin main

# Rendre les scripts exécutables
chmod +x backup-mongodb.sh deploy.sh
```

## 🚀 Solution avec Script Automatique

Si le script `fix-git-conflict-serveur.sh` est disponible :

```bash
cd /root/socialhub_global_v5
chmod +x fix-git-conflict-serveur.sh
./fix-git-conflict-serveur.sh
```

## ⚠️ Pourquoi Écraser ?

**C'est recommandé** car :
- ✅ La version distante contient les **corrections de chemins** (`/root` au lieu de `/home/socialhub`)
- ✅ Elle contient l'**authentification MongoDB** corrigée
- ✅ Elle est testée et fonctionnelle
- ✅ Vos modifications locales sont probablement obsolètes

## ✅ Vérification

Après la résolution, testez :

```bash
# Vérifier que les chemins sont corrects
grep "APP_DIR" deploy.sh
# Devrait afficher: APP_DIR="/root/socialhub_global_v5"

grep "BACKUP_DIR" backup-mongodb.sh
# Devrait afficher: BACKUP_DIR="/root/backups/mongodb"

# Tester le backup
./backup-mongodb.sh
```

## 📝 Alternative: Sauvegarder les Modifications Locales

Si vous voulez garder vos modifications locales :

```bash
cd /root/socialhub_global_v5

# Sauvegarder les modifications
git stash push -m "Sauvegarde modifications locales"

# Récupérer les modifications distantes
git pull origin main

# Appliquer vos modifications (si nécessaire)
git stash pop
```

Mais attention : cela peut créer des conflits à résoudre manuellement.

