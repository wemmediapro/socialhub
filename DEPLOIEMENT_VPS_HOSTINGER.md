# 🚀 Guide de Déploiement VPS Hostinger - SocialHub Global V5

Guide complet pour déployer l'application SocialHub sur un serveur VPS Hostinger.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Préparation du VPS](#préparation-du-vps)
3. [Installation des dépendances](#installation-des-dépendances)
4. [Configuration de l'application](#configuration-de-lapplication)
5. [Configuration Nginx](#configuration-nginx)
6. [SSL avec Let's Encrypt](#ssl-avec-lets-encrypt)
7. [Configuration des services systèmes](#configuration-des-services-systèmes)
8. [Déploiement](#déploiement)
9. [Maintenance](#maintenance)

---

## 🎯 Prérequis

### Sur votre VPS Hostinger
- Ubuntu 20.04 LTS ou supérieur
- Minimum 2GB RAM (recommandé: 4GB+)
- 20GB d'espace disque
- Accès root SSH

### Informations nécessaires
- Nom de domaine (ex: `socialhub.votredomaine.com`)
- DNS configuré pour pointer vers votre VPS
- Clés API (Meta, TikTok, Cloudinary)

---

## 🖥️ Préparation du VPS

### 1. Connexion SSH au VPS

```bash
ssh root@votre-ip-vps
```

### 2. Mise à jour du système

```bash
# Mettre à jour les packages
apt update && apt upgrade -y

# Installer les outils de base
apt install -y curl wget git vim ufw build-essential
```

### 3. Configuration du firewall

```bash
# Activer UFW
ufw allow OpenSSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

### 4. Créer un utilisateur pour l'application (recommandé)

```bash
# Créer l'utilisateur
adduser socialhub
usermod -aG sudo socialhub

# Se connecter avec ce nouvel utilisateur
su - socialhub
```

---

## 📦 Installation des dépendances

### 1. Installer Node.js 18.x

```bash
# Installer NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recharger le terminal
source ~/.bashrc

# Installer Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Vérifier l'installation
node --version
npm --version
```

### 2. Installer Docker et Docker Compose

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier l'installation
docker --version
docker-compose --version

# Redémarrer la session pour appliquer les changements de groupe
exit
# Reconnectez-vous en SSH
```

### 3. Installer PM2 (Process Manager)

```bash
npm install -g pm2

# Configurer PM2 pour démarrer au boot
pm2 startup
# Exécuter la commande suggérée
```

### 4. Installer Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 🚀 Configuration de l'application

### 1. Cloner le projet

```bash
# Se placer dans le répertoire home
cd ~

# Cloner votre projet (depuis votre dépôt Git)
git clone https://github.com/votre-username/socialhub_global_v5.git
# OU transférer les fichiers depuis votre machine locale
# scp -r /chemin/local/socialhub_global_v5 socialhub@votre-ip:/home/socialhub/

cd socialhub_global_v5
```

### 2. Configurer les variables d'environnement

```bash
# Créer le fichier .env
nano .env
```

**Contenu du fichier `.env` (adapter avec vos valeurs):**

```env
# Node Environment
NODE_ENV=production

# Application
PORT=3000
APP_URL=https://socialhub.votredomaine.com

# MongoDB
MONGODB_URI=mongodb://localhost:27017/socialhub

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
CLOUDINARY_UPLOAD_PRESET=votre_preset

# Meta (Facebook/Instagram)
META_APP_ID=votre_app_id
META_APP_SECRET=votre_app_secret
META_REDIRECT_URI=https://socialhub.votredomaine.com/api/auth/meta/callback

# TikTok
TIKTOK_CLIENT_KEY=votre_client_key
TIKTOK_CLIENT_SECRET=votre_client_secret
TIKTOK_REDIRECT_URI=https://socialhub.votredomaine.com/api/auth/tiktok/callback

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe
SMTP_FROM=votre_email@gmail.com
```

### 3. Démarrer MongoDB et Redis avec Docker

```bash
# Démarrer les services
docker-compose up -d

# Vérifier que les services sont actifs
docker-compose ps
```

### 4. Installer les dépendances et builder l'application

```bash
# Installer les dépendances
npm install

# Builder l'application Next.js
npm run build
```

---

## 🌐 Configuration Nginx

### 1. Créer la configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/socialhub
```

**Contenu du fichier:**

```nginx
# Configuration initiale (HTTP seulement)
server {
    listen 80;
    server_name socialhub.votredomaine.com;

    # Logs
    access_log /var/log/nginx/socialhub-access.log;
    error_log /var/log/nginx/socialhub-error.log;

    # Limite de taille des uploads
    client_max_body_size 100M;

    # Proxy vers Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts pour les requêtes longues
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache pour les fichiers statiques Next.js
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Activer la configuration

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL avec Let's Encrypt

### 1. Installer Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtenir le certificat SSL

```bash
# Remplacer par votre domaine et email
sudo certbot --nginx -d socialhub.votredomaine.com --email votre@email.com --agree-tos --no-eff-email
```

### 3. Renouvellement automatique

```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Le renouvellement automatique est déjà configuré via cron
```

**Votre configuration Nginx sera automatiquement mise à jour avec SSL. Vérifiez:**

```bash
sudo nano /etc/nginx/sites-available/socialhub
```

---

## ⚙️ Configuration des services systèmes

### 1. Configuration PM2 pour l'application Next.js

Créer le fichier `ecosystem.config.js`:

```bash
nano ~/socialhub_global_v5/ecosystem.config.js
```

**Contenu:**

```javascript
module.exports = {
  apps: [
    {
      name: 'socialhub-app',
      script: 'npm',
      args: 'start',
      cwd: '/home/socialhub/socialhub_global_v5',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'socialhub-queue',
      script: 'npm',
      args: 'run queue',
      cwd: '/home/socialhub/socialhub_global_v5',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/queue-error.log',
      out_file: './logs/queue-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'socialhub-insights',
      script: 'npm',
      args: 'run insights',
      cwd: '/home/socialhub/socialhub_global_v5',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/insights-error.log',
      out_file: './logs/insights-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
```

### 2. Créer le dossier logs

```bash
mkdir -p ~/socialhub_global_v5/logs
```

### 3. Démarrer les applications avec PM2

```bash
cd ~/socialhub_global_v5

# Démarrer toutes les applications
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Vérifier le statut
pm2 status
pm2 logs
```

### 4. Configuration systemd pour Docker Compose (optionnel mais recommandé)

Créer le service systemd pour démarrer automatiquement MongoDB et Redis:

```bash
sudo nano /etc/systemd/system/socialhub-docker.service
```

**Contenu:**

```ini
[Unit]
Description=SocialHub Docker Services
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/socialhub/socialhub_global_v5
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=socialhub

[Install]
WantedBy=multi-user.target
```

**Activer le service:**

```bash
sudo systemctl enable socialhub-docker.service
sudo systemctl start socialhub-docker.service
sudo systemctl status socialhub-docker.service
```

---

## 🎬 Déploiement

### Script de déploiement automatique

Créer un script `deploy.sh`:

```bash
nano ~/socialhub_global_v5/deploy.sh
```

**Contenu:**

```bash
#!/bin/bash

echo "🚀 Début du déploiement SocialHub..."

# Aller dans le répertoire du projet
cd /home/socialhub/socialhub_global_v5

# Pull les dernières modifications (si utilisation de Git)
echo "📥 Récupération des dernières modifications..."
git pull origin main

# Installer les nouvelles dépendances
echo "📦 Installation des dépendances..."
npm install

# Builder l'application
echo "🏗️ Build de l'application..."
npm run build

# Redémarrer les services PM2
echo "🔄 Redémarrage des services..."
pm2 restart ecosystem.config.js

# Afficher le statut
echo "✅ Déploiement terminé!"
pm2 status

echo ""
echo "📊 Logs disponibles avec: pm2 logs"
echo "🔍 Statut: pm2 status"
```

**Rendre le script exécutable:**

```bash
chmod +x ~/socialhub_global_v5/deploy.sh
```

### Premier déploiement

```bash
cd ~/socialhub_global_v5
./deploy.sh
```

### Vérification

```bash
# Vérifier les services PM2
pm2 status

# Vérifier les logs
pm2 logs --lines 50

# Vérifier Nginx
sudo systemctl status nginx

# Vérifier Docker
docker-compose ps

# Tester l'application
curl -I https://socialhub.votredomaine.com
```

---

## 🔧 Maintenance

### Commandes utiles PM2

```bash
# Statut de tous les services
pm2 status

# Logs en temps réel
pm2 logs

# Logs d'une application spécifique
pm2 logs socialhub-app
pm2 logs socialhub-queue
pm2 logs socialhub-insights

# Redémarrer une application
pm2 restart socialhub-app

# Redémarrer toutes les applications
pm2 restart all

# Arrêter une application
pm2 stop socialhub-app

# Supprimer une application
pm2 delete socialhub-app

# Moniteur en temps réel
pm2 monit
```

### Commandes Docker

```bash
# Voir les conteneurs actifs
docker-compose ps

# Logs MongoDB
docker-compose logs mongo

# Logs Redis
docker-compose logs redis

# Redémarrer les services
docker-compose restart

# Arrêter les services
docker-compose down

# Démarrer les services
docker-compose up -d
```

### Nettoyage et optimisation

```bash
# Nettoyer les logs PM2
pm2 flush

# Nettoyer les images Docker inutilisées
docker system prune -a

# Nettoyer les volumes Docker inutilisés
docker volume prune

# Vérifier l'espace disque
df -h

# Vérifier l'utilisation de la RAM
free -h
```

### Sauvegarde de la base de données

Créer un script de backup automatique:

```bash
nano ~/backup-mongodb.sh
```

**Contenu:**

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/socialhub/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="socialhub_global_v5-mongo-1"

# Créer le répertoire de backup s'il n'existe pas
mkdir -p $BACKUP_DIR

# Créer le backup
echo "🔄 Création du backup MongoDB..."
docker exec $CONTAINER_NAME mongodump --out=/tmp/backup

# Copier le backup hors du conteneur
docker cp $CONTAINER_NAME:/tmp/backup $BACKUP_DIR/backup_$TIMESTAMP

# Compresser le backup
cd $BACKUP_DIR
tar -czf backup_$TIMESTAMP.tar.gz backup_$TIMESTAMP
rm -rf backup_$TIMESTAMP

# Garder seulement les 7 derniers backups
ls -t $BACKUP_DIR/backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "✅ Backup terminé: backup_$TIMESTAMP.tar.gz"
```

**Rendre exécutable et planifier avec cron:**

```bash
chmod +x ~/backup-mongodb.sh

# Éditer le crontab
crontab -e

# Ajouter cette ligne pour un backup quotidien à 3h du matin
0 3 * * * /home/socialhub/backup-mongodb.sh >> /home/socialhub/logs/backup.log 2>&1
```

### Restauration d'un backup

```bash
# Décompresser le backup
cd /home/socialhub/backups/mongodb
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz

# Copier dans le conteneur
docker cp backup_YYYYMMDD_HHMMSS socialhub_global_v5-mongo-1:/tmp/restore

# Restaurer
docker exec socialhub_global_v5-mongo-1 mongorestore /tmp/restore
```

### Monitoring

Installer un outil de monitoring simple:

```bash
# Installer htop pour surveiller les ressources
sudo apt install -y htop

# Installer netdata (monitoring avancé)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Accéder à Netdata sur http://votre-ip:19999
# Configurer Nginx pour y accéder via sous-domaine si nécessaire
```

### Rotation des logs Nginx

```bash
# Créer la configuration de rotation
sudo nano /etc/logrotate.d/socialhub
```

**Contenu:**

```
/var/log/nginx/socialhub-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

---

## 🔍 Troubleshooting

### L'application ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs socialhub-app --lines 100

# Vérifier les logs du build
cat ~/socialhub_global_v5/logs/app-error.log

# Vérifier que MongoDB et Redis sont actifs
docker-compose ps

# Vérifier les variables d'environnement
cat ~/socialhub_global_v5/.env
```

### Erreur de connexion MongoDB

```bash
# Vérifier que MongoDB est actif
docker-compose ps
docker-compose logs mongo

# Tester la connexion
docker exec -it socialhub_global_v5-mongo-1 mongosh
```

### Erreur 502 Bad Gateway (Nginx)

```bash
# Vérifier que l'application Next.js est active
pm2 status
pm2 logs socialhub-app

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/socialhub-error.log

# Vérifier que le port 3000 est en écoute
netstat -tuln | grep 3000
```

### Manque de mémoire

```bash
# Vérifier l'utilisation de la RAM
free -h

# Identifier les processus gourmands
htop

# Redémarrer PM2
pm2 restart all

# Ajouter du swap si nécessaire (2GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Problème de permissions

```bash
# Vérifier les propriétaires des fichiers
ls -la ~/socialhub_global_v5

# Corriger les permissions
sudo chown -R socialhub:socialhub ~/socialhub_global_v5
chmod -R 755 ~/socialhub_global_v5
```

---

## 📊 Checklist de déploiement

- [ ] VPS configuré avec Ubuntu 20.04+
- [ ] DNS configuré pour pointer vers le VPS
- [ ] Node.js 18+ installé
- [ ] Docker et Docker Compose installés
- [ ] PM2 installé globalement
- [ ] Nginx installé et configuré
- [ ] Firewall (UFW) configuré
- [ ] Projet cloné sur le VPS
- [ ] Variables d'environnement configurées (.env)
- [ ] MongoDB et Redis démarrés (Docker)
- [ ] Application buildée (`npm run build`)
- [ ] PM2 configuré avec ecosystem.config.js
- [ ] Services PM2 démarrés et sauvegardés
- [ ] SSL configuré avec Let's Encrypt
- [ ] Backups automatiques configurés
- [ ] Monitoring configuré
- [ ] Tests de l'application réussis

---

## 🎯 URLs importantes après déploiement

```
Application:        https://socialhub.votredomaine.com
Login:             https://socialhub.votredomaine.com/login
Dashboard:         https://socialhub.votredomaine.com/
Projets:           https://socialhub.votredomaine.com/projects
Calendrier:        https://socialhub.votredomaine.com/calendar-pro
```

---

## 📞 Support

En cas de problème:

1. Vérifier les logs: `pm2 logs`
2. Vérifier les services: `pm2 status` et `docker-compose ps`
3. Consulter les logs Nginx: `sudo tail -f /var/log/nginx/socialhub-error.log`
4. Vérifier les ressources: `htop` ou `free -h`

---

**✅ Votre application SocialHub est maintenant déployée en production sur votre VPS Hostinger !**

Pour tout déploiement futur, utilisez simplement: `./deploy.sh`

