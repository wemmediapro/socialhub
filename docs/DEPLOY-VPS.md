# Hébergement Social Hub sur le VPS 31.97.199.38

Guide pour déployer et héberger cette version de l’application sur le serveur VPS de manière fiable, avec Nginx, HTTPS (Let’s Encrypt) et PM2.

## Vue d’ensemble

- **Serveur** : VPS `31.97.199.38` (Debian/Ubuntu recommandé)
- **Stack** : Node.js 20, MongoDB, Next.js (PM2), Nginx (reverse proxy), SSL optionnel
- **Dossiers sur le serveur** : `/root/social/app` (app), `/root/social/uploads` (médias)

## Prérequis

- Accès SSH root (ou utilisateur avec sudo) au VPS
- `sshpass` installé en local : `brew install sshpass` (macOS) ou `apt install sshpass` (Linux)
- Pour HTTPS : un **nom de domaine** dont le DNS pointe vers `31.97.199.38` (ex. `app.votredomaine.com`)

---

## Option A : Déploiement rapide (IP seule)

Sans domaine : l’app est accessible en **http://31.97.199.38** (port 80, via Nginx).  
Après le premier déploiement, configurez Nginx une fois :

```bash
cd "/Users/ahmed/Desktop/social v7"
export SSHPASS='VOTRE_MOT_DE_PASSE_SSH'
export DOMAIN=
./scripts/setup-vps-nginx.sh
```

Puis ouvrez : **http://31.97.199.38** (sans :3000 — le port 3000 est souvent bloqué par l’hébergeur).

---

## Option B : Hébergement recommandé (domaine + Nginx + HTTPS)

### 1. DNS

Créez une entrée A (ou CNAME) pointant votre domaine vers le VPS, par exemple :

- `app.votredomaine.com` → `31.97.199.38`

Attendez la propagation DNS (quelques minutes à quelques heures).

### 2. Premier déploiement de l’application

```bash
cd "/Users/ahmed/Desktop/social v7"
export SSHPASS='VOTRE_MOT_DE_PASSE_SSH'
export APP_URL='https://app.votredomaine.com'
./scripts/deploy-full.sh
```

Cela installe Node.js, MongoDB, PM2, déploie le code et démarre l’app sur le port 3000.

### 3. Configurer Nginx et SSL (une fois)

Sur la même machine, installez Nginx, configurez le reverse proxy et (optionnel) le certificat Let’s Encrypt :

```bash
export SSHPASS='VOTRE_MOT_DE_PASSE_SSH'
export DOMAIN=app.votredomaine.com
./scripts/setup-vps-nginx.sh
```

Ce script :

- Installe Nginx et configure le reverse proxy vers `127.0.0.1:3000`
- Installe Certbot et obtient un certificat SSL pour `DOMAIN`
- Redirige HTTP → HTTPS
- Configure le pare-feu (ufw) pour les ports 22, 80, 443

Après exécution, l’application est accessible sur : **https://app.votredomaine.com**

### 4. Redéploiements ultérieurs

À chaque mise à jour de code :

```bash
export SSHPASS='VOTRE_MOT_DE_PASSE_SSH'
export APP_URL='https://app.votredomaine.com'
./scripts/deploy-full.sh
```

---

## Variables d’environnement utiles

| Variable    | Défaut              | Description |
|------------|----------------------|-------------|
| `SSH_HOST` | `31.97.199.38`      | IP ou hostname du VPS |
| `SSH_USER` | `root`              | Utilisateur SSH |
| `APP_URL`  | `http://IP:3000`    | URL publique de l’app (pour .env et callbacks OAuth) |
| `DOMAIN`   | —                   | Domaine pour Nginx + Certbot (script `setup-vps-nginx.sh`) |

Exemple avec un autre serveur et domaine :

```bash
export SSH_HOST=192.168.1.10
export APP_URL=https://social.mondomaine.com
export DOMAIN=social.mondomaine.com
export SSHPASS='...'
./scripts/deploy-full.sh
./scripts/setup-vps-nginx.sh
```

---

## Fichier .env sur le serveur

Le script `deploy-full.sh` crée ou met à jour dans `/root/social/app/.env` au moins :

- `APP_URL`
- `MONGODB_URI`
- `LOCAL_UPLOAD_DIR`
- `META_REDIRECT_URI` et `TIKTOK_REDIRECT_URI` (dérivés de `APP_URL`)

Pour Meta (Facebook/Instagram) et TikTok, configurez aussi dans ce `.env` (ou en amont dans votre `.env` local si vous le synchronisez) :

- `META_APP_ID`, `META_APP_SECRET`
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`

Et dans les consoles développeur Meta / TikTok, définissez les URLs de redirection sur :

- `https://app.votredomaine.com/api/auth/meta/callback`
- `https://app.votredomaine.com/api/auth/tiktok/callback`

---

## Vérification du déploiement

Pour vérifier que l’application, les médias et la base de données sont bien présents sur le VPS :

```bash
export SSHPASS='VOTRE_MOT_DE_PASSE'
./scripts/verify-deploy.sh
```

Le script affiche :

- **Application** : présence de `.env`, `package.json`, build `.next`, sources, `public`
- **Médias** : nombre de fichiers et taille dans `/root/social/uploads`, comparés au local ; lien symbolique `public/uploads`
- **MongoDB** : état du service `mongod` et, si actif, liste des collections et nombre de documents dans la base `socialhub`
- **PM2** : processus `socialhub` en cours

**Note** : les **données** MongoDB ne sont pas copiées par le script de déploiement. Si vous avez des données en local, il faut les exporter puis les importer sur le serveur (voir ci‑dessous). Si MongoDB n’est pas installé ou pas démarré sur le VPS, installez‑le ou pointez `MONGODB_URI` vers une instance distante.

### Transférer les données MongoDB locales vers le VPS

**Méthode automatique (recommandée)** — installe/démarre MongoDB sur le VPS, exporte la base locale, transfère et restaure :

```bash
# Démarrer MongoDB en local si besoin : brew services start mongodb-community
export SSHPASS='VOTRE_MOT_DE_PASSE'
./scripts/mongo-install-and-migrate.sh
```

**Méthode manuelle** — sur votre machine (avec MongoDB local) :

```bash
mongodump --db=socialhub --out=./socialhub-dump
```

Puis envoyer le dossier `socialhub-dump` sur le VPS et restaurer :

```bash
# Sur le VPS (après avoir copié socialhub-dump)
mongorestore --db=socialhub ./socialhub-dump/socialhub
```

---

## Commandes utiles sur le serveur

En SSH sur le VPS :

```bash
# Statut de l’app
pm2 status
pm2 logs socialhub

# Redémarrer après modification du .env
pm2 restart socialhub --update-env

# MongoDB
systemctl status mongod
```

---

## Dépannage

- **502 Bad Gateway** : l’app Next.js ne tourne pas ou pas sur le port 3000. Vérifiez `pm2 status` et `pm2 logs socialhub`.
- **Certificat SSL échoue** : vérifiez que le DNS du domaine pointe bien vers l’IP du VPS et que les ports 80 et 443 sont ouverts (ufw et éventuellement pare-feu du fournisseur).
- **Connexion MongoDB** : vérifiez `MONGODB_URI` dans `/root/social/app/.env` et que `mongod` est actif (`systemctl status mongod`).

En résumé : pour la **meilleure solution** sur le VPS 31.97.199.38, utilisez un domaine, déployez avec `APP_URL=https://votredomaine.com`, puis lancez une fois `setup-vps-nginx.sh` avec `DOMAIN=votredomaine.com` pour Nginx + HTTPS.
