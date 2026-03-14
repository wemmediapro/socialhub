# 🚀 COMMENCEZ ICI - Déploiement SocialHub VPS Hostinger

## 👋 Bonjour !

Vous êtes prêt à déployer **SocialHub Global V5** sur votre VPS Hostinger.  
Ce guide vous orientera vers les bonnes ressources en 3 questions.

---

## ❓ Question 1: Quelle est votre situation ?

### A) 🆕 Je n'ai jamais déployé d'application sur un VPS

**➡️ Commencez par:**
1. **Lire**: `DEPLOIEMENT_RAPIDE.md` (Guide pas à pas simplifié)
2. **Suivre**: Exactement les étapes une par une
3. **Temps estimé**: 40-60 minutes

**📚 Ressources complémentaires:**
- `TRANSFERT_FICHIERS.md` pour transférer depuis Windows
- `DEPLOIEMENT_VPS_HOSTINGER.md` si vous voulez plus de détails

---

### B) 💼 J'ai déjà déployé des applications, je connais Linux

**➡️ Commencez par:**
1. **Lire**: `DEPLOIEMENT_README.md` (Architecture et vue d'ensemble)
2. **Exécuter**: `setup-vps.sh` puis `deploy.sh`
3. **Temps estimé**: 30-40 minutes

**📚 Ressources complémentaires:**
- `DEPLOIEMENT_VPS_HOSTINGER.md` pour les détails techniques
- Scripts prêts à l'emploi dans le dossier racine

---

### C) 🔧 Je suis DevOps, je veux tout comprendre et personnaliser

**➡️ Commencez par:**
1. **Lire**: `DEPLOIEMENT_VPS_HOSTINGER.md` (Guide exhaustif)
2. **Analyser**: Scripts et configurations
3. **Adapter**: Selon votre infrastructure

**📚 Ressources complémentaires:**
- Tous les fichiers de configuration pour personnalisation
- Section Monitoring et Sécurité avancée

---

## ❓ Question 2: Qu'est-ce qui est déjà prêt ?

### ✅ Ce qui est fourni dans ce package

```
📘 5 Guides de déploiement complets
🔧 3 Scripts automatisés prêts à l'emploi
⚙️ 3 Fichiers de configuration pré-configurés
📚 Documentation complète du projet
```

### ⚠️ Ce dont vous avez besoin

```
✓ VPS Hostinger (Ubuntu 20.04+, 2GB+ RAM)
✓ Nom de domaine avec DNS configuré
✓ Clés API:
  - Cloudinary (upload médias)
  - Meta/Facebook (publication FB/IG)
  - TikTok (publication TikTok)
✓ Client SSH (déjà dans Windows 10+)
```

---

## ❓ Question 3: Quelle méthode de déploiement ?

### 🌟 Méthode 1: Git (Recommandée)

**Avantages:** Professionnel, facile à mettre à jour, tracé des versions

```bash
# Sur Windows
git init
git add .
git commit -m "Ready for deployment"
git push origin main

# Sur VPS
git clone https://github.com/votre-repo/socialhub_global_v5.git
./deploy.sh
```

**📖 Guide:** `TRANSFERT_FICHIERS.md` section Git

---

### 📁 Méthode 2: WinSCP (Interface graphique)

**Avantages:** Simple, visuel, pas besoin de Git

1. Télécharger WinSCP
2. Se connecter au VPS
3. Glisser-déposer les fichiers

**📖 Guide:** `TRANSFERT_FICHIERS.md` section WinSCP

---

### ⚡ Méthode 3: SCP (Ligne de commande)

**Avantages:** Rapide, direct

```powershell
scp -r . socialhub@votre-ip:/home/socialhub/socialhub_global_v5
```

**📖 Guide:** `TRANSFERT_FICHIERS.md` section SCP

---

## 🗺️ Votre roadmap de déploiement

```
┌──────────────────────────────────────────────────┐
│           VOTRE PARCOURS DE DÉPLOIEMENT          │
└──────────────────────────────────────────────────┘

📚 ÉTAPE 1: Lecture (10 min)
   └─ Lire le guide adapté à votre profil
      (voir Question 1 ci-dessus)

🔑 ÉTAPE 2: Préparation (10 min)
   ├─ Vérifier votre VPS est accessible
   ├─ Vérifier votre DNS pointe vers le VPS
   ├─ Préparer vos clés API
   └─ Remplir env.template avec vos valeurs

🖥️ ÉTAPE 3: Configuration VPS (10 min)
   ├─ Exécuter: setup-vps.sh
   └─ Installe: Node.js, Docker, PM2, Nginx

📤 ÉTAPE 4: Transfert code (5 min)
   ├─ Méthode Git, WinSCP ou SCP
   └─ Voir TRANSFERT_FICHIERS.md

🚀 ÉTAPE 5: Déploiement (15 min)
   ├─ Configurer .env
   ├─ Démarrer Docker
   ├─ Builder l'app
   ├─ Démarrer PM2
   ├─ Configurer Nginx
   └─ Configurer SSL

✅ ÉTAPE 6: Vérification (5 min)
   ├─ Tester l'application
   ├─ Vérifier les logs
   └─ Confirmer le SSL

⏱️ TEMPS TOTAL: 40-60 minutes
```

---

## 📋 Checklist avant de commencer

Cochez avant de démarrer:

**Accès VPS**
- [ ] J'ai l'IP de mon VPS Hostinger
- [ ] Je peux me connecter en SSH: `ssh root@mon-ip`
- [ ] Mon VPS a au moins 2GB de RAM
- [ ] Mon VPS a Ubuntu 20.04 ou supérieur

**Domaine**
- [ ] J'ai un nom de domaine
- [ ] Le DNS pointe vers mon VPS (A record)
- [ ] Le DNS a propagé (test: `ping mondomaine.com`)

**API Keys**
- [ ] J'ai mes credentials Cloudinary
- [ ] J'ai mon App ID Meta/Facebook
- [ ] J'ai mon Client Key TikTok
- [ ] Toutes les clés sont testées et valides

**Local**
- [ ] Le projet fonctionne en local (`npm run dev`)
- [ ] Toutes les dépendances sont installées
- [ ] Git est installé (si méthode Git)
- [ ] WinSCP ou FileZilla installé (si méthode graphique)

---

## 🎯 Démarrage rapide (TL;DR)

Pour ceux qui veulent aller vite:

### Sur le VPS (en tant que root)
```bash
# 1. Setup automatique
wget https://raw.githubusercontent.com/votre-repo/socialhub_global_v5/main/setup-vps.sh
bash setup-vps.sh

# 2. Passer à l'utilisateur socialhub
su - socialhub
```

### Ensuite (en tant que socialhub)
```bash
# 3. Cloner le projet
git clone https://github.com/votre-repo/socialhub_global_v5.git
cd socialhub_global_v5

# 4. Configurer
cp env.template .env
nano .env  # Remplir vos valeurs

# 5. Déployer
chmod +x *.sh
./deploy.sh

# 6. Nginx + SSL
sudo cp nginx-config-example.conf /etc/nginx/sites-available/socialhub
sudo nano /etc/nginx/sites-available/socialhub  # Mettre votre domaine
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d votre-domaine.com
```

### Vérification
```bash
pm2 status
curl -I https://votre-domaine.com
```

---

## 📚 Index des fichiers

### 🌟 À lire en priorité
- **`START_HERE.md`** ← Vous êtes ici
- **`DEPLOIEMENT_RAPIDE.md`** ← Guide express 40 min
- **`TRANSFERT_FICHIERS.md`** ← Comment transférer depuis Windows

### 📖 Documentation complète
- **`DEPLOIEMENT_VPS_HOSTINGER.md`** - Guide exhaustif
- **`DEPLOIEMENT_README.md`** - Vue d'ensemble
- **`INDEX_DEPLOIEMENT.md`** - Index et navigation

### 🔧 Scripts à utiliser
- **`setup-vps.sh`** - Configuration initiale VPS
- **`deploy.sh`** - Déploiement et mises à jour
- **`backup-mongodb.sh`** - Backup automatique

### ⚙️ Fichiers de configuration
- **`ecosystem.config.js`** - Configuration PM2
- **`env.template`** - Template variables d'environnement
- **`nginx-config-example.conf`** - Configuration Nginx

---

## 🎬 Prêt à commencer ?

### 👉 Choisissez votre guide:

**🟢 Débutant → Je veux un guide simple**
```
▶️ Lire: DEPLOIEMENT_RAPIDE.md
```

**🟡 Intermédiaire → Je veux comprendre l'architecture**
```
▶️ Lire: DEPLOIEMENT_README.md
```

**🔴 Avancé → Je veux tous les détails**
```
▶️ Lire: DEPLOIEMENT_VPS_HOSTINGER.md
```

**🪟 Windows → Comment transférer mes fichiers ?**
```
▶️ Lire: TRANSFERT_FICHIERS.md
```

**📚 Navigation → Voir tous les fichiers**
```
▶️ Lire: INDEX_DEPLOIEMENT.md
```

---

## 💡 Conseils avant de commencer

1. **Prenez votre temps** - Lisez le guide en entier avant de commencer
2. **Testez d'abord en local** - Assurez-vous que tout fonctionne
3. **Préparez vos API keys** - Ayez-les sous la main
4. **Faites un backup** - Si vous migrez depuis un autre serveur
5. **Notez vos configurations** - Domaine, IP, credentials

---

## 🆘 Besoin d'aide ?

### Avant le déploiement
- Lire: `DEPLOIEMENT_RAPIDE.md` section "Prérequis"
- Vérifier: Checklist ci-dessus

### Pendant le déploiement
- Suivre: Le guide étape par étape
- Ne pas sauter d'étapes
- Vérifier chaque commande avant d'exécuter

### Après le déploiement
- Consulter: `DEPLOIEMENT_VPS_HOSTINGER.md` section "Troubleshooting"
- Vérifier les logs: `pm2 logs`
- Vérifier les services: `pm2 status`, `docker-compose ps`

---

## 🎉 C'est parti !

**Vous avez tout ce qu'il faut pour réussir votre déploiement.**

### Prochaine action:
1. ✅ Cochez la checklist ci-dessus
2. 📖 Ouvrez le guide adapté à votre profil
3. 🚀 Suivez les étapes

---

### 📞 Questions fréquentes

**Q: Combien de temps ça prend ?**  
R: 40-60 minutes pour un premier déploiement complet

**Q: Dois-je connaître Linux ?**  
R: Non, les guides sont détaillés avec toutes les commandes

**Q: Quel est le coût ?**  
R: VPS Hostinger (~5-15€/mois) + Domaine (~10€/an)

**Q: Puis-je tester avant ?**  
R: Oui, tous les services ont des plans gratuits ou d'essai

**Q: Et si je bloque ?**  
R: Section Troubleshooting dans chaque guide

---

**🚀 Bon déploiement !**

_SocialHub Global V5 - Production Ready_

---

**Navigation rapide:**
- 📘 [Déploiement Rapide](DEPLOIEMENT_RAPIDE.md)
- 📙 [Transfert Fichiers](TRANSFERT_FICHIERS.md)
- 📕 [Guide Complet](DEPLOIEMENT_VPS_HOSTINGER.md)
- 📗 [Vue d'ensemble](DEPLOIEMENT_README.md)
- 📚 [Index](INDEX_DEPLOIEMENT.md)

