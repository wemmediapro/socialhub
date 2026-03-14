# 🖥️ Démarrage de l'Application sur le Serveur

## ✅ État Actuel
- ✅ Git pull réussi
- ✅ npm install réussi  
- ✅ 0 vulnérabilité détectée
- ❌ PM2 ne trouve pas le processus "socialhub"

## 🔍 Vérification de l'État PM2

Exécutez ces commandes pour vérifier :

```bash
# Voir tous les processus PM2
pm2 list

# Voir tous les processus (y compris arrêtés)
pm2 list --all

# Voir les logs PM2
pm2 logs
```

## 🚀 Solutions pour Redémarrer l'Application

### Option 1 : Si l'application existe sous un autre nom

```bash
# Voir tous les processus
pm2 list

# Redémarrer avec le bon nom (remplacer par le nom réel)
pm2 restart <nom-du-processus>
```

### Option 2 : Si l'application n'existe pas dans PM2

#### Méthode A : Démarrer avec PM2 (Recommandé)

```bash
cd ~/socialhub_global_v5

# Build de l'application
npm run build

# Démarrer avec PM2
pm2 start npm --name "socialhub" -- start

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
```

#### Méthode B : Démarrer directement (Développement)

```bash
cd ~/socialhub_global_v5

# Démarrer en mode développement
npm run dev

# Ou en mode production
npm run build
npm start
```

## 📝 Configuration PM2 Recommandée

Créez un fichier `ecosystem.config.js` à la racine du projet :

```javascript
module.exports = {
  apps: [{
    name: 'socialhub',
    script: 'npm',
    args: 'start',
    cwd: '/root/socialhub_global_v5',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Puis démarrez avec :

```bash
pm2 start ecosystem.config.js
pm2 save
```

## 🔍 Vérification

```bash
# Vérifier que l'application est démarrée
pm2 status

# Voir les logs en temps réel
pm2 logs socialhub

# Vérifier que l'application répond
curl http://localhost:3000
```

## 🛑 Arrêt de l'Application

```bash
# Arrêter
pm2 stop socialhub

# Arrêter et supprimer
pm2 delete socialhub
```

## 📊 Monitoring

```bash
# Monitorer en temps réel
pm2 monit

# Voir les statistiques
pm2 describe socialhub
```

