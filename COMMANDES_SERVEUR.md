# 🖥️ Commandes à Exécuter sur le Serveur

## 🔧 Résolution du Conflit package-lock.json

Exécutez ces commandes **dans l'ordre** sur votre serveur :

```bash
# 1. Aller dans le dossier du projet
cd ~/socialhub_global_v5

# 2. Écraser le package-lock.json local avec la version distante
# (Ce fichier est régénéré automatiquement lors de npm install)
git checkout -- package-lock.json

# 3. Récupérer les dernières modifications
git pull origin main

# 4. Installer les dépendances (régénère package-lock.json correctement)
npm install

# 5. Vérifier qu'il n'y a plus de vulnérabilités
npm audit

# 6. Redémarrer l'application
# Si vous utilisez PM2 :
pm2 restart socialhub

# Ou si vous démarrez directement :
npm run build
npm start
```

## ✅ Alternative : Stash puis Pull

Si vous préférez sauvegarder les modifications locales :

```bash
cd ~/socialhub_global_v5

# Sauvegarder les modifications
git stash

# Récupérer les modifications
git pull origin main

# Installer les dépendances
npm install

# Redémarrer l'application
pm2 restart socialhub
```

## 📝 Explication

- `package-lock.json` peut différer entre les environnements
- Ce fichier est régénéré automatiquement par `npm install`
- Il est sûr de l'écraser avec la version distante
- Après `npm install`, il sera synchronisé avec `package.json`

## 🎯 Après le Pull

Vérifiez que les nouveaux fichiers sont présents :

```bash
# Vérifier les nouveaux fichiers
ls -la start.ps1 start.bat stop.ps1 stop.bat
ls -la src/i18n/messages/it.json
ls -la DEMARRAGE_RAPIDE.md DEPANNAGE_ERREUR_500.md
```

## 🔍 Vérification

```bash
# Vérifier la version de Next.js (doit être 14.2.33)
grep "next" package.json

# Vérifier qu'il n'y a plus de vulnérabilités
npm audit

# Vérifier le statut Git
git status
```

