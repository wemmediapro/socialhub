# 🚀 Guide de Déploiement - Modifications sur le Serveur

## 📋 Prérequis

- Accès SSH au serveur
- Application déjà installée sur le serveur
- Git configuré sur le serveur
- PM2 installé et configuré

## 🔄 Étapes de Déploiement

### Étape 1 : Se connecter au serveur

```bash
ssh votre_utilisateur@votre_serveur_ip
# ou
ssh root@votre_serveur_ip
```

### Étape 2 : Naviguer vers le dossier de l'application

```bash
cd /root/socialhub_global_v5
# ou selon votre configuration:
# cd /home/socialhub/socialhub_global_v5
```

### Étape 3 : Récupérer les dernières modifications

```bash
# Vérifier le statut actuel
git status

# Récupérer les modifications depuis GitHub
git pull origin main
```

**Si vous avez des conflits ou des modifications locales :**
```bash
# Sauvegarder vos modifications locales (si nécessaire)
git stash

# Puis pull
git pull origin main

# Restaurer vos modifications (si nécessaire)
git stash pop
```

### Étape 4 : Installer les nouvelles dépendances (si nécessaire)

```bash
npm install
```

> ⚠️ **Note**: Si vous avez ajouté de nouvelles dépendances dans `package.json`, cette étape est obligatoire.

### Étape 5 : Rebuild l'application

```bash
npm run build
```

Cette étape est **CRITIQUE** car Next.js en production utilise un build précompilé. Sans rebuild, les modifications ne seront pas prises en compte.

### Étape 6 : Redémarrer l'application avec PM2

```bash
# Redémarrer tous les services PM2
pm2 restart ecosystem.config.js

# Ou redémarrer spécifiquement l'application
pm2 restart socialhub-app

# Vérifier le statut
pm2 status

# Voir les logs pour vérifier qu'il n'y a pas d'erreurs
pm2 logs socialhub-app --lines 50
```

### Étape 7 : Vérifier que tout fonctionne

```bash
# Vérifier que l'application répond
curl http://localhost:3000

# Vérifier les logs en temps réel
pm2 logs socialhub-app
```

## 🎯 Script de Déploiement Automatique

Vous pouvez utiliser le script `deploy.sh` qui fait tout automatiquement :

```bash
cd /root/socialhub_global_v5
chmod +x deploy.sh
./deploy.sh
```

Le script fait automatiquement :
1. ✅ Récupération des modifications Git
2. ✅ Installation des dépendances
3. ✅ Build de l'application
4. ✅ Redémarrage PM2

## 📝 Commandes Complètes (Copier-Coller)

```bash
# Connexion et navigation
cd /root/socialhub_global_v5

# Récupération des modifications
git pull origin main

# Installation des dépendances
npm install

# Build de l'application
npm run build

# Redémarrage PM2
pm2 restart ecosystem.config.js

# Vérification
pm2 status
pm2 logs socialhub-app --lines 20
```

## 🔍 Vérifications Post-Déploiement

### 1. Vérifier que l'application est en ligne

```bash
pm2 status
```

Vous devriez voir `online` pour `socialhub-app`.

### 2. Vérifier les logs pour les erreurs

```bash
pm2 logs socialhub-app --err --lines 50
```

### 3. Tester l'upload d'image

1. Aller sur l'application : `https://votre-domaine.com`
2. Créer ou modifier un post
3. Uploader une image
4. Vérifier que l'image s'affiche (plus d'erreur 404)

### 4. Vérifier que les URLs utilisent `/api/uploads/`

Dans les logs ou la console du navigateur, les URLs devraient être :
- ✅ `https://votre-domaine.com/api/uploads/filename.png`
- ❌ Plus de `https://votre-domaine.com/uploads/filename.png` (404)

## 🐛 Résolution de Problèmes

### Problème : `git pull` échoue avec "uncommitted changes"

```bash
# Sauvegarder les modifications locales
git stash

# Pull
git pull origin main

# Restaurer (si nécessaire)
git stash pop
```

### Problème : `npm run build` échoue

```bash
# Nettoyer le cache
rm -rf .next
rm -rf node_modules

# Réinstaller
npm install

# Rebuild
npm run build
```

### Problème : PM2 ne redémarre pas

```bash
# Arrêter complètement
pm2 stop all

# Redémarrer
pm2 start ecosystem.config.js

# Sauvegarder la configuration
pm2 save
```

### Problème : Les images ne s'affichent toujours pas

1. Vérifier que le dossier `public/uploads` existe sur le serveur :
```bash
ls -la public/uploads/
```

2. Vérifier les permissions :
```bash
chmod -R 755 public/uploads/
```

3. Vérifier que la route API fonctionne :
```bash
curl https://votre-domaine.com/api/uploads/nom-fichier.png
```

4. Vérifier les logs de l'API :
```bash
pm2 logs socialhub-app | grep uploads
```

## 📊 Checklist de Déploiement

- [ ] Connecté au serveur via SSH
- [ ] Navigué vers le dossier de l'application
- [ ] Exécuté `git pull origin main`
- [ ] Exécuté `npm install` (si nouvelles dépendances)
- [ ] Exécuté `npm run build`
- [ ] Exécuté `pm2 restart ecosystem.config.js`
- [ ] Vérifié `pm2 status` → application `online`
- [ ] Testé l'upload d'image dans l'interface
- [ ] Vérifié que les images s'affichent (pas d'erreur 404)
- [ ] Vérifié les logs pour confirmer qu'il n'y a pas d'erreurs

## 🎉 Résultat Attendu

Après le déploiement, vous devriez avoir :
- ✅ Formulaire de modification avec tous les champs (projets, assignedTo, schedule, media)
- ✅ Upload d'images fonctionnel dans le workflow (rôle graphiste)
- ✅ Images qui s'affichent correctement (via `/api/uploads/`)
- ✅ Plus d'erreur 404 pour les images uploadées

## 📞 En Cas de Problème

Si vous rencontrez des problèmes :
1. Vérifier les logs : `pm2 logs socialhub-app`
2. Vérifier le statut : `pm2 status`
3. Vérifier que MongoDB et Redis sont actifs : `docker-compose ps`
4. Redémarrer tous les services si nécessaire

---

**Date de création** : $(date)
**Dernière modification** : $(date)

