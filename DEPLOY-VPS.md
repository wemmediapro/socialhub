# Déploiement sur VPS – Upload de vidéos et fichiers

## Si vous voyez « 413 Request Entity Too Large » ou « Fichier trop volumineux »

Le serveur (souvent **Nginx**) refuse le fichier car sa taille dépasse la limite par défaut (souvent 1 Mo). Il faut augmenter cette limite sur le VPS (voir section Nginx ci‑dessous).

---

## Problème courant : échec d’upload de vidéos sur le VPS

En production derrière **Nginx** (ou un autre reverse proxy), les uploads de gros fichiers (vidéos) peuvent échouer si la configuration ne prévoit pas une taille de corps et des timeouts suffisants.

### Nginx

Ajoutez (ou adaptez) dans le bloc `server` qui proxy vers Next.js :

```nginx
# Taille max du corps de requête (ex. 200 Mo pour les vidéos)
client_max_body_size 200M;

# Timeouts pour les uploads longs
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

Puis recharger Nginx : `sudo nginx -t && sudo systemctl reload nginx`.

### Appliquer la correction depuis votre machine (sans ouvrir le serveur à la main)

Depuis le projet, avec le mot de passe SSH et l’hôte du VPS :

```bash
export SSHPASS='VOTRE_MOT_DE_PASSE'
export SSH_HOST=africamediaconnect.fr   # ou l’IP du VPS
./scripts/apply-nginx-upload-fix.sh
```

Le script se connecte au serveur, met à jour la config Nginx (200 Mo, timeouts 300 s) et recharge Nginx.

### Variable d’environnement

Dans `.env` sur le VPS vous pouvez définir :

- `LOCAL_UPLOAD_MAX_MB=200` — taille max d’un fichier en Mo (défaut : 200).
- `LOCAL_UPLOAD_DIR` — dossier des uploads (optionnel, par défaut `public/uploads`).

L’API d’upload (`/api/upload/local`) utilise déjà un timeout de 5 minutes (`maxDuration: 300`) pour les grosses vidéos.
