# 🖥️ Commandes PM2 pour le Serveur

## ✅ Votre Application PM2 s'appelle "socialhub-app"

D'après votre fichier `ecosystem.config.js`, le processus s'appelle **"socialhub-app"**.

## 🔄 Redémarrer l'Application

```bash
# Redémarrer avec le bon nom
pm2 restart socialhub-app

# Ou redémarrer tous les processus
pm2 restart all
```

## 📊 Vérifier l'État

```bash
# Voir tous les processus PM2
pm2 list

# Voir les logs en temps réel
pm2 logs socialhub-app

# Voir les statistiques
pm2 describe socialhub-app

# Monitorer
pm2 monit
```

## 🚀 Si l'Application n'est pas Démarrée

```bash
cd ~/socialhub_global_v5

# Build de l'application
npm run build

# Démarrer avec le fichier de configuration
pm2 start ecosystem.config.js

# Sauvegarder la configuration
pm2 save
```

## 🛑 Arrêt

```bash
# Arrêter
pm2 stop socialhub-app

# Arrêter et supprimer
pm2 delete socialhub-app
```

## 📝 Commandes Complètes

```bash
# 1. Aller dans le dossier
cd ~/socialhub_global_v5

# 2. Build (si nécessaire)
npm run build

# 3. Redémarrer avec PM2
pm2 restart socialhub-app

# 4. Vérifier que ça fonctionne
pm2 status
pm2 logs socialhub-app --lines 50
```

## 🔍 Vérification que l'Application Répond

```bash
# Tester localement
curl http://localhost:3000

# Ou avec votre IP publique
curl http://votre-ip-serveur:3000
```

