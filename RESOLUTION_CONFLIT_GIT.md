# 🔧 Résolution du Conflit Git sur le Serveur

## ❌ Problème
Lors du `git pull origin main`, Git détecte des modifications locales dans :
- `package-lock.json`
- `package.json`

Ces fichiers entrent en conflit avec les modifications distantes.

## ✅ Solutions

### Solution 1 : Sauvegarder les modifications locales (Recommandé)

```bash
# 1. Sauvegarder les modifications locales
git stash

# 2. Récupérer les modifications du serveur
git pull origin main

# 3. Si vous voulez récupérer vos modifications locales après
git stash pop
```

### Solution 2 : Écraser les modifications locales (si elles ne sont pas importantes)

```bash
# 1. Supprimer les modifications locales
git checkout -- package-lock.json package.json

# 2. Récupérer les modifications du serveur
git pull origin main
```

### Solution 3 : Commit les modifications locales puis merge

```bash
# 1. Ajouter les modifications locales
git add package-lock.json package.json

# 2. Commit les modifications
git commit -m "chore: Mise à jour package.json local"

# 3. Pull avec merge
git pull origin main

# 4. Si conflit, résoudre manuellement puis :
git add .
git commit -m "Merge: Résolution conflit package.json"
```

## 🎯 Solution Recommandée pour le Serveur

Sur le serveur, exécutez ces commandes :

```bash
# Entrer dans le dossier du projet
cd ~/socialhub_global_v5

# Sauvegarder les modifications locales
git stash

# Récupérer les nouvelles modifications
git pull origin main

# Installer les nouvelles dépendances si nécessaire
npm install

# Redémarrer l'application
# (selon votre méthode de déploiement)
```

## 📝 Explication

- `package-lock.json` et `package.json` peuvent différer entre les environnements
- C'est normal car les dépendances peuvent être installées différemment
- La solution avec `stash` préserve vos modifications si nécessaire
- La solution avec `checkout` utilise la version du dépôt (recommandé pour package.json)

## ⚠️ Important

Après le pull, n'oubliez pas de :
1. Installer les nouvelles dépendances : `npm install`
2. Redémarrer l'application
3. Vérifier que tout fonctionne

