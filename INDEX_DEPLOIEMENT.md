# 📚 Index de Déploiement - SocialHub Global V5

Guide complet de navigation dans la documentation de déploiement VPS Hostinger.

---

## 🎯 Par où commencer ?

### 👤 Je veux déployer rapidement (40 min)
➡️ **`DEPLOIEMENT_RAPIDE.md`**
- Guide condensé étape par étape
- Commandes prêtes à copier-coller
- Parfait pour les déploiements express

### 📖 Je veux comprendre tous les détails
➡️ **`DEPLOIEMENT_VPS_HOSTINGER.md`**
- Guide complet et exhaustif
- Explications détaillées
- Troubleshooting avancé
- Maintenance et monitoring

### 🪟 Je suis sur Windows et je veux transférer mes fichiers
➡️ **`TRANSFERT_FICHIERS.md`**
- Méthodes de transfert (Git, SCP, WinSCP)
- Outils Windows recommandés
- Workflow complet
- Sécurité des transferts

### 📦 Je veux une vue d'ensemble du package
➡️ **`DEPLOIEMENT_README.md`**
- Architecture de déploiement
- Liste des services
- Monitoring et sécurité
- Checklist complète

---

## 📁 Tous les fichiers créés

### 📘 Documentation (4 fichiers)

| Fichier | Taille | Description |
|---------|--------|-------------|
| **DEPLOIEMENT_VPS_HOSTINGER.md** | ~15 KB | 📕 Guide complet de déploiement |
| **DEPLOIEMENT_RAPIDE.md** | ~5 KB | 📗 Guide express (40 min) |
| **DEPLOIEMENT_README.md** | ~8 KB | 📘 Vue d'ensemble du package |
| **TRANSFERT_FICHIERS.md** | ~7 KB | 📙 Guide de transfert Windows → Linux |
| **INDEX_DEPLOIEMENT.md** | ~3 KB | 📚 Ce fichier - Navigation |

### 🔧 Scripts (3 fichiers)

| Fichier | Description | Utilisation |
|---------|-------------|-------------|
| **setup-vps.sh** | Installation initiale du VPS | Une fois, au début |
| **deploy.sh** | Déploiement/mise à jour | À chaque déploiement |
| **backup-mongodb.sh** | Backup MongoDB automatique | Quotidien (cron) |

### ⚙️ Configuration (3 fichiers)

| Fichier | Description | Destination |
|---------|-------------|-------------|
| **ecosystem.config.js** | Configuration PM2 | Racine du projet |
| **env.template** | Template variables d'environnement | À copier en `.env` |
| **nginx-config-example.conf** | Configuration Nginx | `/etc/nginx/sites-available/` |

---

## 🗺️ Roadmap de déploiement

```
┌─────────────────────────────────────────────────────────┐
│                    DÉPLOIEMENT                          │
└─────────────────────────────────────────────────────────┘

📋 PHASE 1: Préparation (5 min)
   ├─ Lire: DEPLOIEMENT_RAPIDE.md
   ├─ Vérifier: VPS, DNS, API keys
   └─ Préparer: Variables d'environnement

🖥️ PHASE 2: Configuration VPS (10 min)
   ├─ Script: setup-vps.sh
   ├─ Installe: Node.js, Docker, PM2, Nginx
   └─ Crée: Utilisateur socialhub

📤 PHASE 3: Transfert Code (5 min)
   ├─ Méthode: Git (recommandé)
   ├─ Alternative: SCP, WinSCP
   └─ Lire: TRANSFERT_FICHIERS.md

⚙️ PHASE 4: Configuration App (10 min)
   ├─ Créer: .env depuis env.template
   ├─ Démarrer: docker-compose up -d
   └─ Builder: npm install && npm run build

🚀 PHASE 5: Déploiement (5 min)
   ├─ PM2: pm2 start ecosystem.config.js
   ├─ Nginx: Configuration + activation
   └─ SSL: certbot --nginx

✅ PHASE 6: Vérification (5 min)
   ├─ Tests: pm2 status, curl, browser
   ├─ Logs: pm2 logs
   └─ Monitoring: pm2 monit

📊 PHASE 7: Post-déploiement (optionnel)
   ├─ Backup: backup-mongodb.sh + cron
   ├─ Monitoring: Netdata, logs
   └─ Documentation: Notes personnelles

⏱️ TEMPS TOTAL: ~40 minutes
```

---

## 🎓 Guides par niveau d'expérience

### 🟢 Débutant
1. **Commencer par**: `DEPLOIEMENT_RAPIDE.md`
2. **Suivre pas à pas** les commandes
3. **Si problème**: Section Troubleshooting
4. **Transfert**: `TRANSFERT_FICHIERS.md` → Méthode WinSCP (graphique)

### 🟡 Intermédiaire
1. **Lire**: `DEPLOIEMENT_README.md` pour comprendre l'architecture
2. **Exécuter**: `DEPLOIEMENT_RAPIDE.md`
3. **Personnaliser**: Configuration selon vos besoins
4. **Transfert**: Git ou SCP en ligne de commande

### 🔴 Avancé
1. **Parcourir**: `DEPLOIEMENT_VPS_HOSTINGER.md` pour les détails
2. **Adapter**: Scripts selon votre infrastructure
3. **Optimiser**: Performance, sécurité, monitoring
4. **Automatiser**: CI/CD, backups, alertes

---

## 📖 Guide de lecture par objectif

### 🎯 Je veux juste déployer vite
```
1. DEPLOIEMENT_RAPIDE.md (lire en entier)
2. TRANSFERT_FICHIERS.md (section Git)
3. Exécuter les commandes
```

### 🎯 Je veux comprendre l'architecture
```
1. DEPLOIEMENT_README.md (section Architecture)
2. DEPLOIEMENT_VPS_HOSTINGER.md (sections Services)
3. Parcourir les scripts pour comprendre
```

### 🎯 J'ai un problème
```
1. DEPLOIEMENT_VPS_HOSTINGER.md (section Troubleshooting)
2. DEPLOIEMENT_RAPIDE.md (section Troubleshooting)
3. Logs: pm2 logs, docker logs, nginx logs
```

### 🎯 Je veux automatiser
```
1. deploy.sh (déploiement automatique)
2. backup-mongodb.sh (backup automatique)
3. DEPLOIEMENT_VPS_HOSTINGER.md (section Maintenance)
```

### 🎯 Je veux sécuriser
```
1. DEPLOIEMENT_VPS_HOSTINGER.md (sections Sécurité, SSL)
2. DEPLOIEMENT_README.md (section Sécurité)
3. Configurer: Firewall, SSL, permissions
```

---

## 🔍 Recherche rapide

### Commandes importantes

**Déploiement initial:**
```bash
bash setup-vps.sh           # Configuration VPS
./deploy.sh                 # Déploiement
```

**Gestion quotidienne:**
```bash
pm2 status                  # État des services
pm2 logs                    # Logs en temps réel
./deploy.sh                 # Mise à jour
./backup-mongodb.sh         # Backup
```

**Troubleshooting:**
```bash
pm2 logs --lines 100        # Derniers logs
docker-compose logs         # Logs Docker
sudo tail -f /var/log/nginx/socialhub-error.log
```

### Fichiers de configuration

| Fichier | Chemin | Description |
|---------|--------|-------------|
| .env | `~/socialhub_global_v5/.env` | Variables d'environnement |
| PM2 | `~/socialhub_global_v5/ecosystem.config.js` | Config PM2 |
| Nginx | `/etc/nginx/sites-available/socialhub` | Config Nginx |
| Docker | `~/socialhub_global_v5/docker-compose.yml` | Services Docker |

### URLs importantes

| Service | URL | Description |
|---------|-----|-------------|
| Application | `https://socialhub.votredomaine.com` | Interface principale |
| Login | `https://socialhub.votredomaine.com/login` | Authentification |
| Dashboard | `https://socialhub.votredomaine.com/` | Tableau de bord |
| API Health | `https://socialhub.votredomaine.com/api/health` | Health check |

---

## 💡 Cas d'usage

### Cas 1: Nouveau déploiement depuis zéro
```
1. Lire: DEPLOIEMENT_RAPIDE.md
2. Exécuter: setup-vps.sh
3. Transférer: Git clone
4. Configurer: .env
5. Déployer: deploy.sh
6. Nginx + SSL
```

### Cas 2: Mise à jour de l'application
```
1. Sur Windows: git push
2. Sur VPS: ./deploy.sh
3. Vérifier: pm2 status
```

### Cas 3: Migration depuis un autre serveur
```
1. Backup ancien serveur: backup-mongodb.sh
2. Nouveau VPS: setup-vps.sh
3. Transférer code: Git clone
4. Restaurer DB: mongorestore
5. Déployer: deploy.sh
```

### Cas 4: Problème en production
```
1. Vérifier: pm2 logs, pm2 status
2. Consulter: DEPLOIEMENT_VPS_HOSTINGER.md Troubleshooting
3. Redémarrer: pm2 restart all
4. Si critique: Restaurer backup
```

---

## 🔗 Liens rapides

### Documentation projet
- `README.md` - Documentation générale
- `GUIDE_RAPIDE.md` - Guide utilisateur
- `PROJECT_PRESENTATION.md` - Présentation complète
- `SOLUTION_COMPLETE.md` - Solution technique

### Documentation déploiement
- `DEPLOIEMENT_VPS_HOSTINGER.md` - ⭐ Guide complet
- `DEPLOIEMENT_RAPIDE.md` - ⚡ Guide express
- `DEPLOIEMENT_README.md` - 📦 Vue d'ensemble
- `TRANSFERT_FICHIERS.md` - 📤 Transfert Windows

### Scripts
- `setup-vps.sh` - Setup initial
- `deploy.sh` - Déploiement
- `backup-mongodb.sh` - Backup
- `start.sh` - Démarrage local
- `stop.sh` - Arrêt local

### Configuration
- `ecosystem.config.js` - PM2
- `env.template` - Variables d'env
- `nginx-config-example.conf` - Nginx
- `docker-compose.yml` - Docker

---

## ✅ Checklist complète

### Avant de commencer
- [ ] VPS Hostinger provisionné
- [ ] Nom de domaine configuré
- [ ] DNS pointant vers le VPS
- [ ] Clés API obtenues (Meta, TikTok, Cloudinary)
- [ ] Variables d'environnement préparées

### Setup VPS
- [ ] `setup-vps.sh` exécuté
- [ ] Node.js installé
- [ ] Docker installé
- [ ] PM2 installé
- [ ] Nginx installé
- [ ] Firewall configuré

### Déploiement
- [ ] Code transféré (Git/SCP)
- [ ] `.env` créé et configuré
- [ ] Services Docker démarrés
- [ ] `npm install` réussi
- [ ] `npm run build` réussi
- [ ] PM2 configuré et démarré
- [ ] Nginx configuré
- [ ] SSL configuré (Certbot)

### Vérification
- [ ] `pm2 status` → tous en "online"
- [ ] `docker-compose ps` → tous "Up"
- [ ] Application accessible via HTTPS
- [ ] Login fonctionnel
- [ ] Workers actifs (queue, insights)
- [ ] Aucune erreur dans les logs

### Post-déploiement
- [ ] Backup automatique configuré
- [ ] Monitoring configuré
- [ ] Documentation à jour
- [ ] Équipe informée
- [ ] Tests en production réussis

---

## 🎉 Félicitations !

Une fois le déploiement terminé, vous aurez:

✅ Application SocialHub en production  
✅ HTTPS avec SSL Let's Encrypt  
✅ Déploiement automatisé avec PM2  
✅ Backups automatiques configurés  
✅ Monitoring des services actif  
✅ Architecture scalable et sécurisée  

---

## 📞 Besoin d'aide ?

1. **Troubleshooting**: Voir `DEPLOIEMENT_VPS_HOSTINGER.md` section Troubleshooting
2. **Logs**: `pm2 logs`, `docker-compose logs`, `/var/log/nginx/`
3. **Statut**: `pm2 status`, `pm2 monit`, `docker-compose ps`
4. **Documentation**: Relire les guides selon votre besoin

---

**🚀 Prêt à déployer ? Commencez par `DEPLOIEMENT_RAPIDE.md` !**

---

_Dernière mise à jour: Octobre 2025_  
_Version: 1.0.0_  
_SocialHub Global V5 - Production Ready_

