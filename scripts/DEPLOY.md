# Déploiement Social Hub sur le serveur

## Solution 1 : Docker (recommandé – isolé, pas de conflit de port)

L’app et MongoDB tournent dans des **conteneurs Docker** (port **3100**), sans toucher à vos autres services (pm2, etc.).

```bash
export SSHPASS='Testmediapro2026@'
./scripts/deploy-docker.sh
```

- Crée ou met à jour le dossier `/root/social` sur le serveur  
- Installe Docker sur le serveur si besoin  
- Lance `docker compose up -d --build` (build de l’image + MongoDB)  
- **URL :** http://187.77.168.205:3100  

Sur le serveur :
```bash
cd /root/social && docker compose ps
docker compose logs -f app
```

---

## Solution 2 : Script tout-en-un (Node + pm2)

Un seul script installe **tout** sur le serveur et héberge l’app dans `/root/social` :

- Node.js 20 LTS  
- MongoDB  
- pm2  
- Dossiers `/root/social/app`, `uploads`, `data`  
- Déploiement du code, build, médias  
- Démarrage de l’application avec pm2  

```bash
export SSHPASS='Testmediapro2026@'
./scripts/deploy-full.sh
```

À la fin, l’app est accessible sur **http://187.77.168.205:3000** (si le port 3000 est ouvert).

---

## Serveur

- **Hôte :** 187.77.168.205  
- **Utilisateur :** root  
- **Dossier :** `/root/social`

---

## Scripts séparés (optionnel)

## 1. Créer la structure sur le serveur

Depuis votre machine (avec `sshpass` installé : `brew install sshpass` sur Mac) :

```bash
export SSHPASS='Testmediapro2026@'
./scripts/deploy-server-setup.sh
```

Ou en une ligne :

```bash
SSHPASS='Testmediapro2026@' ./scripts/deploy-server-setup.sh
```

Cela crée sur le serveur :

- `/root/social/app` — application Next.js  
- `/root/social/uploads` — médias (équivalent de `public/uploads`)  
- `/root/social/data` — données MongoDB (si MongoDB tourne sur le serveur)

---

## 2. Déployer l’application et les médias

```bash
export SSHPASS='Testmediapro2026@'
./scripts/deploy-push.sh
```

Le script :

- fait un `npm run build` en local  
- envoie le code (sans `node_modules`) et le build `.next` vers le serveur  
- envoie le contenu de `public/uploads` vers `/root/social/uploads`  
- lance `npm install --production` sur le serveur  

---

## 3. Configuration sur le serveur

### Fichier `.env` dans `/root/social/app/.env`

```env
APP_URL=https://votre-domaine.com
MONGODB_URI=mongodb://localhost:27017/socialhub
LOCAL_UPLOAD_DIR=/root/social/uploads
```

Si MongoDB est sur une autre machine, adaptez `MONGODB_URI`.  
Si vous n’avez pas encore de base, installez MongoDB sur le serveur ou utilisez un service (MongoDB Atlas, etc.).

### Lancer l’application

```bash
ssh root@187.77.168.205
cd /root/social/app
npm start
```

Ou avec **pm2** (recommandé en production) :

```bash
pm2 start npm --name socialhub -- start
pm2 save
pm2 startup
```

---

## 4. Base de données et médias

- **MongoDB :** soit installé localement (`/root/social/data` pour les données), soit `MONGODB_URI` pointant vers un serveur distant.  
- **Médias :** tous les fichiers dans `public/uploads` sont copiés vers `/root/social/uploads`. Dans `.env` sur le serveur, `LOCAL_UPLOAD_DIR=/root/social/uploads` pour que l’app les serve correctement.

---

## Sécurité

- Ne commitez pas le mot de passe. Utilisez `export SSHPASS=...` en local ou une clé SSH :  
  `ssh-copy-id root@187.77.168.205`  
  puis vous pourrez vous connecter sans mot de passe et adapter les scripts pour ne plus utiliser `sshpass`.
