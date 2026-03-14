# Corriger l’erreur 413 (Request Entity Too Large) sur africamediaconnect.fr

Vous voyez encore **413** et **« Unexpected token '<' »** parce que :

1. **Le serveur Nginx** limite la taille des uploads (souvent 1 Mo par défaut).
2. **Le site en production** utilise peut‑être encore l’ancien code (sans le message d’erreur clair).

Faites les **deux** étapes ci‑dessous.

---

## Étape 1 – Déployer la nouvelle version du code

Depuis votre Mac, dans le dossier du projet :

```bash
cd "/Users/ahmed/Desktop/social v7"

export SSHPASS='VOTRE_MOT_DE_PASSE'
export SSH_HOST=africamediaconnect.fr

# Build + envoi vers le serveur
./scripts/deploy-push.sh
```

Ensuite, sur le serveur, redémarrer l’app (si vous utilisez pm2) :

```bash
ssh root@africamediaconnect.fr
pm2 restart socialhub
# ou: cd /root/social/app && npm start
```

Après déploiement, en cas de 413 vous verrez un message clair au lieu de « Unexpected token '<' ».

---

## Étape 2 – Augmenter la limite Nginx sur le VPS

Toujours depuis votre Mac :

```bash
export SSHPASS='VOTRE_MOT_DE_PASSE'
export SSH_HOST=africamediaconnect.fr

./scripts/apply-nginx-upload-fix.sh
```

Cela met la limite à **200 Mo** et recharge Nginx. Réessayez ensuite l’upload de la vidéo.

---

## Si vous préférez modifier Nginx à la main

1. Connectez-vous au serveur :  
   `ssh root@africamediaconnect.fr`

2. Éditez la config du site (souvent l’un des fichiers listés) :  
   `nano /etc/nginx/sites-available/socialhub`  
   ou  
   `nano /etc/nginx/sites-enabled/default`

3. Dans le bloc `server { ... }`, ajoutez ou modifiez pour avoir :

   ```nginx
   client_max_body_size 200M;
   ```

   Et dans le bloc `location /` qui contient `proxy_pass` :

   ```nginx
   proxy_read_timeout 300s;
   proxy_connect_timeout 300s;
   proxy_send_timeout 300s;
   ```

4. Test et rechargement :

   ```bash
   nginx -t && systemctl reload nginx
   ```

---

## Vérification

- Après **étape 1** : plus d’erreur « Unexpected token '<' » ; un message explicite s’affiche en cas de problème.
- Après **étape 2** : l’upload de vidéos jusqu’à 200 Mo doit fonctionner.

Si le 413 continue après la modification de Nginx, une autre couche (ex. reverse proxy de l’hébergeur, Cloudflare) peut limiter la taille : vérifiez leur documentation ou le support.
