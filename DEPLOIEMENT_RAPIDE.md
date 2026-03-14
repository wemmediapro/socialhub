# 🚀 Guide de Déploiement Rapide - SocialHub VPS Hostinger

Guide condensé pour un déploiement rapide. Pour la version complète, voir `DEPLOIEMENT_VPS_HOSTINGER.md`.

---

## 📋 Checklist Pré-Déploiement

- [ ] VPS Hostinger provisionné (Ubuntu 20.04+, 2GB+ RAM)
- [ ] Nom de domaine configuré (DNS pointant vers le VPS)
- [ ] Accès SSH root au VPS
- [ ] Clés API prêtes (Meta, TikTok, Cloudinary)

---

## ⚡ Déploiement en 5 étapes

### Étape 1: Configuration initiale du serveur (10 min)

```bash
# Se connecter au VPS
ssh root@votre-ip-vps

# Télécharger et exécuter le script de setup
wget https://raw.githubusercontent.com/votre-repo/socialhub_global_v5/main/setup-vps.sh
chmod +x setup-vps.sh
bash setup-vps.sh

# Passer à l'utilisateur socialhub
su - socialhub
```

### Étape 2: Déployer l'application (15 min)

```bash
# Cloner le projet
cd ~
git clone https://github.com/votre-username/socialhub_global_v5.git
cd socialhub_global_v5

# Copier le template de configuration
cp env.template .env
nano .env  # Remplir avec vos vraies valeurs

# Démarrer MongoDB et Redis
docker-compose up -d

# Installer et builder
npm install
npm run build

# Créer le dossier logs
mkdir -p logs

# Mettre à jour le chemin dans ecosystem.config.js
nano ecosystem.config.js
# Remplacer /home/socialhub/socialhub_global_v5 par le chemin réel si différent

# Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

### Étape 3: Configurer Nginx (5 min)

```bash
# Copier la configuration Nginx
sudo cp nginx-config-example.conf /etc/nginx/sites-available/socialhub

# Éditer pour mettre votre domaine
sudo nano /etc/nginx/sites-available/socialhub
# Remplacer "socialhub.votredomaine.com" par votre vrai domaine

# Activer la configuration
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Tester et recharger
sudo nginx -t
sudo systemctl reload nginx
```

### Étape 4: Configurer SSL (5 min)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d socialhub.votredomaine.com --email votre@email.com --agree-tos --no-eff-email

# Recharger Nginx
sudo systemctl reload nginx
```

### Étape 5: Vérifier et tester (5 min)

```bash
# Vérifier les services
pm2 status
docker-compose ps
sudo systemctl status nginx

# Tester l'application
curl -I https://socialhub.votredomaine.com

# Voir les logs
pm2 logs --lines 50
```

---

## 🎯 URLs après déploiement

```
Application:   https://socialhub.votredomaine.com
Login:        https://socialhub.votredomaine.com/login
Dashboard:    https://socialhub.votredomaine.com/
Projets:      https://socialhub.votredomaine.com/projects
Calendrier:   https://socialhub.votredomaine.com/calendar-pro
```

---

## 🔧 Configuration .env minimale

```env
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://socialhub.votredomaine.com

# Database
MONGODB_URI=mongodb://localhost:27017/socialhub
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
CLOUDINARY_UPLOAD_PRESET=votre_preset

# Meta
META_APP_ID=votre_app_id
META_APP_SECRET=votre_app_secret
META_REDIRECT_URI=https://socialhub.votredomaine.com/api/auth/meta/callback

# TikTok
TIKTOK_CLIENT_KEY=votre_client_key
TIKTOK_CLIENT_SECRET=votre_client_secret
TIKTOK_REDIRECT_URI=https://socialhub.votredomaine.com/api/auth/tiktok/callback
```

---

## 📊 Commandes essentielles

### Gestion PM2
```bash
pm2 status          # Voir le statut
pm2 logs            # Voir les logs
pm2 restart all     # Redémarrer tout
pm2 monit          # Monitoring en temps réel
```

### Gestion Docker
```bash
docker-compose ps           # Voir les conteneurs
docker-compose logs         # Voir les logs
docker-compose restart      # Redémarrer
```

### Déploiement rapide
```bash
cd ~/socialhub_global_v5
./deploy.sh         # Déployer les nouvelles modifications
```

### Backup MongoDB
```bash
cd ~/socialhub_global_v5
./backup-mongodb.sh  # Créer un backup
```

---

## 🆘 Troubleshooting rapide

### L'application ne démarre pas
```bash
pm2 logs socialhub-app --lines 100
pm2 restart socialhub-app
```

### MongoDB ne se connecte pas
```bash
docker-compose ps
docker-compose restart mongo
docker-compose logs mongo
```

### Erreur 502 (Nginx)
```bash
pm2 status
netstat -tuln | grep 3000
sudo systemctl reload nginx
```

### Manque de mémoire
```bash
free -h
pm2 restart all
# Ajouter du swap si nécessaire (voir guide complet)
```

---

## 📦 Backup automatique (optionnel)

```bash
# Rendre le script exécutable
chmod +x ~/socialhub_global_v5/backup-mongodb.sh

# Configurer le cron pour backup quotidien à 3h
crontab -e

# Ajouter cette ligne:
0 3 * * * /home/socialhub/socialhub_global_v5/backup-mongodb.sh >> /home/socialhub/logs/backup.log 2>&1
```

---

## 📚 Documentation complète

Pour plus de détails, consultez:
- **`DEPLOIEMENT_VPS_HOSTINGER.md`** - Guide complet avec tous les détails
- **`README.md`** - Documentation générale du projet
- **`GUIDE_RAPIDE.md`** - Guide utilisateur de l'application

---

## ✅ C'est tout !

Votre application SocialHub est maintenant déployée en production sur votre VPS Hostinger !

**Temps total estimé:** ~40 minutes

Pour les mises à jour futures: `./deploy.sh`

---

**Support:** En cas de problème, consultez la section Troubleshooting du guide complet.

