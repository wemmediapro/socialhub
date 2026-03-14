# 🔐 Configuration SSH pour GitHub

## 🔴 Problème Actuel

Vous avez cette erreur :
```
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

Cela signifie que la clé SSH n'est pas configurée ou n'est pas ajoutée à GitHub.

## ✅ Solution : Configurer la Clé SSH

### Étape 1: Vérifier si une Clé SSH Existe Déjà

```bash
ls -la ~/.ssh
```

Si vous voyez `id_ed25519` ou `id_rsa`, vous avez déjà une clé. Passez à l'étape 2.
Sinon, générez une nouvelle clé (étape 1b).

### Étape 1b: Générer une Nouvelle Clé SSH

```bash
ssh-keygen -t ed25519 -C "votre-email@example.com"
```

- Appuyez sur **Entrée** pour accepter l'emplacement par défaut (`/root/.ssh/id_ed25519`)
- Entrez un **mot de passe** (ou laissez vide pour plus de simplicité)
- Confirmez le mot de passe

### Étape 2: Afficher la Clé Publique

```bash
cat ~/.ssh/id_ed25519.pub
```

**Copiez tout le contenu** qui commence par `ssh-ed25519` et se termine par votre email.

### Étape 3: Ajouter la Clé à GitHub

1. **Allez sur GitHub** : https://github.com/settings/keys
2. **Cliquez sur "New SSH key"** (ou "Add SSH key")
3. **Donnez un titre** : "Serveur SocialHub" (ou n'importe quel nom)
4. **Collez la clé publique** dans le champ "Key"
5. **Cliquez sur "Add SSH key"**

### Étape 4: Tester la Connexion SSH

```bash
ssh -T git@github.com
```

Vous devriez voir :
```
Hi web483! You've successfully authenticated, but GitHub does not provide shell access.
```

Si vous voyez cela, c'est bon ! ✅

### Étape 5: Configurer Git pour Utiliser SSH

```bash
cd /root/socialhub_global_v5
git remote set-url origin git@github.com:web483/socialhub_global_v5.git
```

### Étape 6: Tester le Pull

```bash
git pull origin main
```

Ça devrait fonctionner maintenant ! ✅

---

## 🔄 Alternative : Utiliser HTTPS avec Token

Si vous préférez utiliser HTTPS au lieu de SSH :

### Étape 1: Créer un Personal Access Token

1. Allez sur : https://github.com/settings/tokens
2. Cliquez sur "Generate new token (classic)"
3. Donnez un nom : "Serveur SocialHub"
4. Sélectionnez le scope : `repo` (tous les droits)
5. Cliquez sur "Generate token"
6. **Copiez le token** (vous ne pourrez plus le voir après !)

### Étape 2: Configurer Git avec le Token

```bash
cd /root/socialhub_global_v5
git remote set-url origin https://VOTRE_TOKEN@github.com/web483/socialhub_global_v5.git
```

**Remplacez `VOTRE_TOKEN` par le token que vous avez copié.**

### Étape 3: Tester

```bash
git pull origin main
```

---

## 🎯 Recommandation

**Utilisez SSH** (première méthode) car :
- ✅ Plus sécurisé
- ✅ Pas besoin de régénérer des tokens
- ✅ Fonctionne à long terme
- ✅ Standard pour les serveurs

---

## ⚠️ Dépannage

### Si "Permission denied" persiste après avoir ajouté la clé :

1. **Vérifier que la clé est bien ajoutée** :
```bash
cat ~/.ssh/id_ed25519.pub
```
Comparez avec ce qui est sur GitHub.

2. **Vérifier les permissions** :
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

3. **Tester la connexion** :
```bash
ssh -vT git@github.com
```
Le `-v` affiche des détails de débogage.

### Si vous avez plusieurs clés SSH :

Créez un fichier `~/.ssh/config` :
```bash
cat > ~/.ssh/config << EOF
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
EOF

chmod 600 ~/.ssh/config
```

---

## 📝 Résumé des Commandes

```bash
# 1. Générer la clé (si pas déjà fait)
ssh-keygen -t ed25519 -C "votre-email@example.com"

# 2. Afficher la clé publique
cat ~/.ssh/id_ed25519.pub
# (Copiez et ajoutez sur GitHub)

# 3. Tester la connexion
ssh -T git@github.com

# 4. Configurer Git
cd /root/socialhub_global_v5
git remote set-url origin git@github.com:web483/socialhub_global_v5.git

# 5. Tester le pull
git pull origin main
```

Une fois configuré, le script `deploy.sh` pourra faire des pulls automatiques sans problème ! 🎉

