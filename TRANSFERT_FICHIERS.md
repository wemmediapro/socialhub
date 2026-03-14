# 📤 Guide de Transfert des Fichiers - Windows vers VPS Hostinger

Guide pour transférer votre application SocialHub depuis Windows vers votre VPS Linux.

---

## 🎯 Méthodes de transfert

### Méthode 1: Git (Recommandée) ⭐

C'est la méthode la plus propre et professionnelle.

#### Sur Windows (préparation)

```bash
# 1. Initialiser Git si ce n'est pas déjà fait
git init

# 2. Créer un fichier .gitignore
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo ".next/" >> .gitignore
echo "logs/" >> .gitignore
echo "mongodb_data/" >> .gitignore

# 3. Commit les fichiers
git add .
git commit -m "Initial commit - SocialHub deployment ready"

# 4. Créer un repo sur GitHub/GitLab/Bitbucket
# Puis pousser le code
git remote add origin https://github.com/votre-username/socialhub_global_v5.git
git branch -M main
git push -u origin main
```

#### Sur le VPS

```bash
# Se connecter au VPS
ssh root@votre-ip-vps

# Passer à l'utilisateur socialhub
su - socialhub

# Cloner le projet
cd ~
git clone https://github.com/votre-username/socialhub_global_v5.git
cd socialhub_global_v5

# Rendre les scripts exécutables
chmod +x deploy.sh backup-mongodb.sh setup-vps.sh
```

---

### Méthode 2: SCP (Transfert direct)

Transférer directement depuis Windows vers le VPS.

#### Option A: Avec PowerShell (Windows 10+)

```powershell
# Depuis le répertoire du projet sur Windows
cd C:\Users\Lilia\Desktop\Cursor\socialhub_global_v5

# Transférer tout le projet
scp -r . socialhub@votre-ip-vps:/home/socialhub/socialhub_global_v5

# OU transférer fichier par fichier (plus sûr)
scp deploy.sh socialhub@votre-ip-vps:/home/socialhub/socialhub_global_v5/
scp backup-mongodb.sh socialhub@votre-ip-vps:/home/socialhub/socialhub_global_v5/
scp ecosystem.config.js socialhub@votre-ip-vps:/home/socialhub/socialhub_global_v5/
# ... etc
```

#### Option B: Avec WinSCP (Interface graphique)

1. **Télécharger WinSCP**: https://winscp.net/
2. **Installer et lancer**
3. **Configurer la connexion**:
   - Protocol: SCP
   - Host: votre-ip-vps
   - Port: 22
   - Username: socialhub
   - Password: votre-mot-de-passe
4. **Se connecter et glisser-déposer** les fichiers

#### Option C: Avec FileZilla

1. **Télécharger FileZilla**: https://filezilla-project.org/
2. **Lancer et configurer**:
   - Host: sftp://votre-ip-vps
   - Username: socialhub
   - Password: votre-mot-de-passe
   - Port: 22
3. **Transférer les fichiers** par glisser-déposer

---

### Méthode 3: Archive ZIP + Upload

Pour les gros projets ou connexions instables.

#### Sur Windows

```powershell
# Créer une archive (exclure node_modules, .next, mongodb_data)
# Utiliser 7-Zip ou l'outil de compression Windows
# OU via PowerShell:
Compress-Archive -Path C:\Users\Lilia\Desktop\Cursor\socialhub_global_v5 -DestinationPath socialhub.zip
```

#### Sur le VPS

```bash
# Upload via SCP
scp socialhub.zip socialhub@votre-ip-vps:/home/socialhub/

# Se connecter au VPS
ssh socialhub@votre-ip-vps

# Décompresser
cd ~
unzip socialhub.zip
cd socialhub_global_v5

# Rendre les scripts exécutables
chmod +x deploy.sh backup-mongodb.sh setup-vps.sh
```

---

## 📋 Fichiers à transférer

### ✅ Fichiers essentiels (OBLIGATOIRES)

```
src/                          → Code source complet
public/                       → Assets publics (si existe)
package.json                  → Dépendances
package-lock.json             → Lock des versions
next.config.mjs              → Config Next.js
tsconfig.json                → Config TypeScript
docker-compose.yml           → Services Docker
ecosystem.config.js          → Config PM2
deploy.sh                    → Script de déploiement
backup-mongodb.sh            → Script de backup
setup-vps.sh                 → Script de setup
env.template                 → Template .env
nginx-config-example.conf    → Config Nginx
start.sh                     → Script de démarrage local
stop.sh                      → Script d'arrêt local
```

### ⚠️ Fichiers à NE PAS transférer

```
node_modules/                → À réinstaller sur le VPS
.next/                       → Build à refaire sur le VPS
mongodb_data/                → Données locales uniquement
logs/                        → À créer sur le VPS
.env                         → JAMAIS (contient les secrets)
.git/ (si pas Git)          → Pas nécessaire
```

### 📄 Documentation (optionnelle mais utile)

```
README.md
DEPLOIEMENT_VPS_HOSTINGER.md
DEPLOIEMENT_RAPIDE.md
DEPLOIEMENT_README.md
GUIDE_RAPIDE.md
PROJECT_PRESENTATION.md
```

---

## 🔐 Sécurité du transfert

### Fichier .env

**⚠️ IMPORTANT**: Ne JAMAIS transférer le fichier `.env` avec vos secrets !

```bash
# Sur le VPS, créer un nouveau .env
ssh socialhub@votre-ip-vps
cd ~/socialhub_global_v5
cp env.template .env
nano .env  # Remplir avec les vraies valeurs
```

### SSH Key (Recommandé)

Au lieu d'utiliser un mot de passe, utilisez une clé SSH.

#### Générer une clé SSH sur Windows

```powershell
# Dans PowerShell
ssh-keygen -t rsa -b 4096 -C "votre_email@example.com"

# Copier la clé publique vers le VPS
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh socialhub@votre-ip-vps "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

---

## 🚀 Workflow complet recommandé

### 1️⃣ Préparation sur Windows

```powershell
# Naviguer vers le projet
cd C:\Users\Lilia\Desktop\Cursor\socialhub_global_v5

# Vérifier que tout est prêt
dir

# Initialiser Git
git init
git add .
git commit -m "Ready for deployment"

# Pousser vers GitHub
git remote add origin https://github.com/votre-username/socialhub_global_v5.git
git push -u origin main
```

### 2️⃣ Configuration du VPS

```bash
# Se connecter au VPS
ssh root@votre-ip-vps

# Installer les prérequis
wget https://raw.githubusercontent.com/votre-username/socialhub_global_v5/main/setup-vps.sh
bash setup-vps.sh

# Passer à l'utilisateur socialhub
su - socialhub
```

### 3️⃣ Déploiement

```bash
# Cloner le projet
cd ~
git clone https://github.com/votre-username/socialhub_global_v5.git
cd socialhub_global_v5

# Rendre les scripts exécutables
chmod +x *.sh

# Configurer l'environnement
cp env.template .env
nano .env  # Remplir avec les vraies valeurs

# Démarrer les services Docker
docker-compose up -d

# Installer et builder
npm install
npm run build

# Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

### 4️⃣ Configuration Nginx et SSL

```bash
# Configurer Nginx
sudo cp nginx-config-example.conf /etc/nginx/sites-available/socialhub
sudo nano /etc/nginx/sites-available/socialhub  # Adapter le domaine
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurer SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d socialhub.votredomaine.com
```

---

## 🔄 Mises à jour futures

### Avec Git (Méthode recommandée)

**Sur Windows:**
```powershell
git add .
git commit -m "Description des modifications"
git push
```

**Sur le VPS:**
```bash
cd ~/socialhub_global_v5
./deploy.sh  # Fait automatiquement: git pull, npm install, build, restart PM2
```

### Avec SCP (Transfert manuel)

**Sur Windows:**
```powershell
scp fichier_modifie.js socialhub@votre-ip-vps:/home/socialhub/socialhub_global_v5/chemin/
```

**Sur le VPS:**
```bash
cd ~/socialhub_global_v5
npm run build
pm2 restart all
```

---

## 🛠️ Outils Windows recommandés

### Terminal/SSH
- **Windows Terminal** (Recommandé) - Moderne et puissant
- **PuTTY** - Client SSH classique
- **PowerShell** - Intégré à Windows

### Transfert de fichiers
- **WinSCP** - Interface graphique, très simple
- **FileZilla** - Open source, multiplateforme
- **SCP** via PowerShell - En ligne de commande

### Éditeur de code
- **VS Code** - Avec extension Remote SSH
- **Cursor** (déjà installé) - AI-powered

### Git
- **Git for Windows** - https://git-scm.com/download/win
- **GitHub Desktop** - Interface graphique

---

## 🎯 Exemple complet pas à pas

```powershell
# === SUR WINDOWS ===

# 1. Aller dans le dossier
cd C:\Users\Lilia\Desktop\Cursor\socialhub_global_v5

# 2. Créer le repo Git et pousser
git init
git add .
git commit -m "Initial deployment"
git remote add origin https://github.com/votreusername/socialhub_global_v5.git
git push -u origin main
```

```bash
# === SUR LE VPS ===

# 3. Se connecter
ssh root@votre-ip-vps

# 4. Setup automatique
wget https://raw.githubusercontent.com/votreusername/socialhub_global_v5/main/setup-vps.sh
bash setup-vps.sh

# 5. Passer à l'utilisateur
su - socialhub

# 6. Cloner et configurer
git clone https://github.com/votreusername/socialhub_global_v5.git
cd socialhub_global_v5
chmod +x *.sh
cp env.template .env
nano .env  # Remplir

# 7. Déployer
docker-compose up -d
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save

# 8. Nginx et SSL
sudo cp nginx-config-example.conf /etc/nginx/sites-available/socialhub
sudo nano /etc/nginx/sites-available/socialhub
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d socialhub.votredomaine.com

# 9. Vérifier
pm2 status
curl -I https://socialhub.votredomaine.com
```

---

## ✅ Checklist de transfert

- [ ] Code source transféré (src/)
- [ ] Fichiers de config transférés (package.json, tsconfig.json, etc.)
- [ ] Scripts de déploiement transférés et exécutables
- [ ] Fichier .env créé sur le VPS (pas transféré !)
- [ ] Services Docker démarrés
- [ ] Dépendances installées (npm install)
- [ ] Application buildée (npm run build)
- [ ] PM2 configuré et services démarrés
- [ ] Nginx configuré
- [ ] SSL configuré
- [ ] Application accessible via HTTPS

---

## 🆘 Problèmes courants

### Permissions denied lors du transfert
```bash
# Sur le VPS, vérifier les permissions
sudo chown -R socialhub:socialhub /home/socialhub/socialhub_global_v5
```

### Fichiers corrompus après transfert
```bash
# Vérifier l'encodage des fichiers
file fichier.sh
# Devrait être: ASCII text executable

# Convertir si nécessaire
dos2unix fichier.sh
```

### Git push refusé
```bash
# Vérifier la connexion GitHub
git remote -v

# Configurer les credentials
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"
```

---

**🎉 Votre application est maintenant prête à être déployée sur votre VPS Hostinger !**

Pour toute question, consultez `DEPLOIEMENT_VPS_HOSTINGER.md`

