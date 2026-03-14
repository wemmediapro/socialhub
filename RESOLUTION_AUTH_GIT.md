# 🔐 Résolution du Problème d'Authentification Git

## 🔴 Problème

Lors du `git pull`, vous avez cette erreur :
```
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/web483/socialhub_global_v5/'
```

## ✅ Solutions

### Solution 1: Utiliser SSH au lieu de HTTPS (Recommandé)

1. **Générer une clé SSH sur le serveur** (si pas déjà fait) :
```bash
ssh-keygen -t ed25519 -C "votre-email@example.com"
# Appuyez sur Entrée pour accepter l'emplacement par défaut
# Entrez un mot de passe (ou laissez vide)
```

2. **Afficher la clé publique** :
```bash
cat ~/.ssh/id_ed25519.pub
```

3. **Ajouter la clé à GitHub** :
   - Allez sur https://github.com/settings/keys
   - Cliquez sur "New SSH key"
   - Collez le contenu de la clé publique
   - Sauvegardez

4. **Changer l'URL du remote Git** :
```bash
cd /root/socialhub_global_v5
git remote set-url origin git@github.com:web483/socialhub_global_v5.git
git pull origin main
```

### Solution 2: Utiliser un Personal Access Token (PAT)

1. **Créer un PAT sur GitHub** :
   - Allez sur https://github.com/settings/tokens
   - Cliquez sur "Generate new token (classic)"
   - Donnez un nom (ex: "Serveur SocialHub")
   - Sélectionnez les scopes : `repo` (tous)
   - Cliquez sur "Generate token"
   - **Copiez le token** (vous ne pourrez plus le voir après)

2. **Configurer Git avec le token** :
```bash
cd /root/socialhub_global_v5
git remote set-url origin https://VOTRE_TOKEN@github.com/web483/socialhub_global_v5.git
```

   Ou utiliser Git Credential Helper :
```bash
git config --global credential.helper store
# Puis lors du prochain pull, entrez:
# Username: votre-username-github
# Password: VOTRE_TOKEN
```

### Solution 3: Désactiver le Pull Automatique (Temporaire)

Si vous ne voulez pas configurer l'authentification maintenant, le script `deploy.sh` a été modifié pour continuer même si le pull échoue. Vous pouvez faire le pull manuellement plus tard.

## 🎯 Recommandation

**Utilisez la Solution 1 (SSH)** car :
- ✅ Plus sécurisé
- ✅ Pas besoin de tokens
- ✅ Fonctionne à long terme
- ✅ Pas de problèmes d'authentification

## 📝 Vérification

Après avoir configuré l'authentification, testez :

```bash
cd /root/socialhub_global_v5
git pull origin main
```

Si ça fonctionne, vous verrez :
```
Already up to date.
```
ou
```
Updating [commit]..[commit]
```

## ⚠️ Note

Le script `deploy.sh` a été modifié pour :
- ✅ Gérer automatiquement les conflits Git
- ✅ Continuer même si le pull échoue
- ✅ Faire un backup avant le déploiement
- ✅ Utiliser les bons chemins (`/root`)

Vous pouvez donc utiliser `./deploy.sh` même sans avoir résolu l'authentification Git, mais il est recommandé de la résoudre pour bénéficier des mises à jour automatiques.

