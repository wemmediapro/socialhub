# 🚀 Guide de Déploiement sur le Serveur

## ✅ Méthode 1 : Script Automatique (Recommandé)

### Étapes :

1. **Se connecter au serveur via SSH** :
```bash
ssh root@votre_ip_serveur
# ou
ssh votre_utilisateur@votre_ip_serveur
```

2. **Naviguer vers le dossier de l'application** :
```bash
cd ~/socialhub_global_v5
# ou selon votre configuration:
# cd /home/socialhub/socialhub_global_v5
# cd /root/socialhub_global_v5
```

3. **Exécuter le script de déploiement** :
```bash
chmod +x deploy.sh
./deploy.sh
```

Le script fait automatiquement :
- ✅ Récupération des modifications Git (`git pull`)
- ✅ Installation des dépendances (`npm install`)
- ✅ Build de l'application (`npm run build`)
- ✅ Redémarrage de l'application avec PM2
- ✅ Vérification du statut

---

## ✅ Méthode 2 : Commandes Manuelles

Si vous préférez exécuter les commandes une par une :

### Étape 1 : Se connecter et naviguer
```bash
ssh root@votre_ip_serveur
cd ~/socialhub_global_v5
```

### Étape 2 : Sauvegarder les modifications locales (si nécessaire)
```bash
git stash
```

### Étape 3 : Récupérer les modifications depuis GitHub
```bash
git pull origin main
```

Si vous avez des conflits :
```bash
git checkout -- package-lock.json package.json
git pull origin main
```

### Étape 4 : Installer les dépendances
```bash
npm install
```

### Étape 5 : Builder l'application (IMPORTANT pour Next.js)
```bash
npm run build
```

### Étape 6 : Redémarrer l'application
```bash
# Si vous utilisez PM2 avec ecosystem.config.js
pm2 restart ecosystem.config.js

# Ou si vous utilisez un nom spécifique
pm2 restart socialhub-app

# Vérifier le statut
pm2 status
```

### Étape 7 : Vérifier les logs
```bash
pm2 logs socialhub-app --lines 50
```

---

## 📋 Checklist de Vérification

Après le déploiement, vérifiez :

- [ ] L'application répond sur l'URL (https://votre-domaine.com)
- [ ] Les logs ne montrent pas d'erreurs (`pm2 logs`)
- [ ] Le statut PM2 est "online" (`pm2 status`)
- [ ] La création de collaborations fonctionne
- [ ] Le bouton "Valider" dans le workflow collab fonctionne
- [ ] Le message de validation affiche "assigné à l'influenceur"
- [ ] Les collaborations planifiées apparaissent dans le calendrier

---

## 🔍 Vérifications Utiles

### Vérifier le dernier commit
```bash
git log --oneline -1
```

### Vérifier les modifications
```bash
git log --oneline -5
```

### Vérifier le statut Git
```bash
git status
```

### Vérifier le statut PM2
```bash
pm2 status
pm2 list
```

### Voir les logs en temps réel
```bash
pm2 logs socialhub-app
```

### Voir les logs d'erreur uniquement
```bash
pm2 logs socialhub-app --err --lines 50
```

---

## 🐛 Résolution de Problèmes

### Problème : `git pull` échoue

```bash
# Sauvegarder les modifications
git stash

# Forcer le pull
git pull origin main --no-edit

# Ou écraser les modifications locales
git fetch origin
git reset --hard origin/main
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
# Arrêter tous les processus
pm2 stop all

# Supprimer l'ancien processus
pm2 delete socialhub-app

# Redémarrer
pm2 start ecosystem.config.js
# ou
pm2 start npm --name "socialhub-app" -- start

# Sauvegarder la configuration
pm2 save
```

### Problème : L'application ne répond pas

```bash
# Vérifier que l'application est en cours d'exécution
pm2 status

# Vérifier les logs pour les erreurs
pm2 logs socialhub-app --lines 100

# Vérifier les ports
netstat -tlnp | grep 3000

# Redémarrer complètement
pm2 restart all
```

---

## ⚡ Commandes Rapides (Tout en Une)

```bash
cd ~/socialhub_global_v5 && \
git stash && \
git pull origin main && \
npm install && \
npm run build && \
pm2 restart ecosystem.config.js && \
pm2 logs socialhub-app --lines 20
```

---

## 📝 Notes Importantes

1. **Build obligatoire** : Next.js nécessite un rebuild (`npm run build`) pour prendre en compte les modifications en production.

2. **PM2** : L'application doit être redémarrée avec PM2 pour appliquer les changements.

3. **Docker** : Si vous utilisez Docker pour MongoDB/Redis, vérifiez que les services sont démarrés :
```bash
docker-compose ps
docker-compose up -d
```

4. **Variables d'environnement** : Assurez-vous que le fichier `.env` est bien configuré sur le serveur.

---

## ✅ Après le Déploiement

Testez les nouvelles fonctionnalités :

1. **Création de collaboration** : Créez une nouvelle collaboration et vérifiez qu'elle est créée avec le statut DRAFT.

2. **Workflow** : Validez une collaboration en DRAFT et vérifiez le message "Collaboration validée et assignée à l'influenceur !".

3. **Calendrier** : Allez dans "Calendrier Publications Influenceurs" et vérifiez que les collaborations planifiées (SCHEDULED) apparaissent.

---

## 🎯 Résumé des Modifications Déployées

- ✅ Correction de la création de collaborations (validation MongoDB)
- ✅ Correction du bouton "Valider" dans le workflow collab
- ✅ Message de validation mis à jour ("assigné à l'influenceur")
- ✅ Ajout des collaborations planifiées dans le calendrier
- ✅ Amélioration de la gestion des erreurs et logs




