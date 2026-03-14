# 📦 Package de Déploiement VPS - SocialHub Global V5

Ce dossier contient tous les fichiers nécessaires pour déployer SocialHub sur un VPS Hostinger.

---

## 📁 Fichiers de déploiement

### 📘 Documentation

| Fichier | Description |
|---------|-------------|
| `DEPLOIEMENT_VPS_HOSTINGER.md` | **Guide complet** avec tous les détails techniques |
| `DEPLOIEMENT_RAPIDE.md` | **Guide express** pour un déploiement rapide (40 min) |
| `DEPLOIEMENT_README.md` | Ce fichier - Vue d'ensemble du package |

### 🔧 Scripts

| Fichier | Description | Usage |
|---------|-------------|-------|
| `setup-vps.sh` | Installation initiale du VPS | `sudo bash setup-vps.sh` |
| `deploy.sh` | Déploiement/mise à jour de l'app | `./deploy.sh` |
| `backup-mongodb.sh` | Backup automatique MongoDB | `./backup-mongodb.sh` |

### ⚙️ Configuration

| Fichier | Description | Destination |
|---------|-------------|-------------|
| `ecosystem.config.js` | Configuration PM2 pour les services | Racine du projet |
| `env.template` | Template des variables d'environnement | Copier en `.env` |
| `nginx-config-example.conf` | Configuration Nginx | `/etc/nginx/sites-available/socialhub` |

---

## 🚀 Démarrage rapide

### Option 1: Déploiement automatique (Recommandé)

```bash
# 1. Se connecter au VPS
ssh root@votre-ip-vps

# 2. Installer les dépendances
wget https://raw.githubusercontent.com/votre-repo/socialhub_global_v5/main/setup-vps.sh
bash setup-vps.sh

# 3. Passer à l'utilisateur socialhub
su - socialhub

# 4. Cloner et configurer
git clone https://github.com/votre-repo/socialhub_global_v5.git
cd socialhub_global_v5
cp env.template .env
nano .env  # Remplir les valeurs

# 5. Déployer
./deploy.sh

# 6. Configurer Nginx et SSL
sudo cp nginx-config-example.conf /etc/nginx/sites-available/socialhub
sudo nano /etc/nginx/sites-available/socialhub  # Adapter le domaine
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d socialhub.votredomaine.com
```

### Option 2: Déploiement manuel

Suivre le guide complet: `DEPLOIEMENT_VPS_HOSTINGER.md`

---

## 📋 Prérequis

### Serveur VPS
- **OS**: Ubuntu 20.04 LTS ou supérieur
- **RAM**: Minimum 2GB (recommandé 4GB)
- **Stockage**: 20GB minimum
- **Accès**: SSH root

### Services externes
- Compte Cloudinary (upload médias)
- App Meta/Facebook (API publication)
- App TikTok (API publication)
- Nom de domaine configuré

---

## 🎯 Architecture de déploiement

```
┌─────────────────────────────────────────────────┐
│                   Internet                      │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Nginx (Port 80/443) │  ← SSL/TLS, Reverse Proxy
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Next.js (Port 3000)  │  ← Application Web
        │      [PM2]            │
        └─────┬─────────┬───────┘
              │         │
    ┌─────────┘         └─────────┐
    ▼                             ▼
┌─────────┐                  ┌─────────┐
│ MongoDB │                  │  Redis  │
│ (27017) │                  │ (6379)  │
└─────────┘                  └─────────┘
    │                             │
    └──────────┬──────────────────┘
               │
               ▼
        [Docker Compose]

   ┌──────────────────────────────┐
   │     Workers PM2:             │
   │  • socialhub-queue           │
   │  • socialhub-insights        │
   └──────────────────────────────┘
```

---

## 📦 Services déployés

### Application Next.js (PM2)
- **Service**: `socialhub-app`
- **Port**: 3000
- **Rôle**: Interface web et API routes

### Worker Queue (PM2)
- **Service**: `socialhub-queue`
- **Rôle**: Publication automatique des posts

### Worker Insights (PM2)
- **Service**: `socialhub-insights`
- **Rôle**: Récupération des analytics

### MongoDB (Docker)
- **Port**: 27017
- **Rôle**: Base de données principale

### Redis (Docker)
- **Port**: 6379
- **Rôle**: File d'attente (BullMQ)

### Nginx
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Rôle**: Reverse proxy, SSL termination

---

## 🔒 Sécurité

### Firewall (UFW)
```bash
# Ports ouverts
22   → SSH
80   → HTTP
443  → HTTPS
```

### SSL/TLS
- Certificat Let's Encrypt
- Renouvellement automatique via Certbot
- Redirection HTTP → HTTPS

### Isolation
- Application tournant sous utilisateur `socialhub` (non-root)
- Services Docker isolés
- Variables sensibles dans `.env` (non versionné)

---

## 📊 Monitoring

### Logs PM2
```bash
pm2 logs                    # Tous les logs
pm2 logs socialhub-app      # App seulement
pm2 monit                   # Monitoring temps réel
```

### Logs Docker
```bash
docker-compose logs mongo   # MongoDB
docker-compose logs redis   # Redis
```

### Logs Nginx
```bash
sudo tail -f /var/log/nginx/socialhub-access.log
sudo tail -f /var/log/nginx/socialhub-error.log
```

### Ressources système
```bash
htop                        # CPU, RAM, processus
df -h                      # Espace disque
free -h                    # Mémoire
netstat -tuln              # Ports en écoute
```

---

## 🔄 Workflow de déploiement

### Premier déploiement
1. `setup-vps.sh` → Configure le serveur
2. Configuration manuelle → .env, Nginx
3. `deploy.sh` → Deploy initial
4. SSL → Certbot

### Mises à jour
1. Commit/Push code
2. SSH vers VPS
3. `./deploy.sh` → Déploie automatiquement

### Backup
- Automatique via cron (quotidien à 3h)
- Manuel: `./backup-mongodb.sh`

---

## 🆘 Support et troubleshooting

### Problème de démarrage
```bash
pm2 logs --lines 100
pm2 restart all
```

### Erreur 502
```bash
pm2 status
sudo systemctl reload nginx
netstat -tuln | grep 3000
```

### Base de données
```bash
docker-compose ps
docker-compose restart mongo
docker exec -it socialhub_global_v5-mongo-1 mongosh
```

### Espace disque plein
```bash
df -h
docker system prune -a
pm2 flush
```

---

## 📚 Documentation additionnelle

- **Guide utilisateur**: `GUIDE_RAPIDE.md`
- **Documentation projet**: `README.md`
- **Présentation complète**: `PROJECT_PRESENTATION.md`
- **Solution technique**: `SOLUTION_COMPLETE.md`

---

## ✅ Checklist post-déploiement

- [ ] Application accessible via HTTPS
- [ ] Connexion login fonctionnelle
- [ ] MongoDB connecté
- [ ] Redis connecté
- [ ] Workers PM2 actifs
- [ ] SSL valide (cadenas vert)
- [ ] Backup automatique configuré
- [ ] Monitoring actif
- [ ] Firewall configuré
- [ ] DNS correctement configuré

---

## 🎉 Déploiement réussi !

Votre application SocialHub Global V5 est maintenant en production sur votre VPS Hostinger.

**Temps total estimé**: 40-60 minutes

**URLs**:
- Application: `https://socialhub.votredomaine.com`
- Login: `https://socialhub.votredomaine.com/login`

**Commandes essentielles**:
```bash
pm2 status              # État des services
pm2 logs               # Logs en temps réel
./deploy.sh            # Déployer une mise à jour
./backup-mongodb.sh    # Créer un backup
```

---

**Développé avec ❤️ pour révolutionner la gestion de contenu digital**

🚀 **SocialHub Global V5** - Production Ready

