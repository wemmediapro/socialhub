# 🔐 Configuration SSH - Commandes Manuelles

## 🔴 Problème

Le script `setup-ssh-github.sh` n'est pas sur le serveur car `git pull` échoue sans SSH configuré.

## ✅ Solution : Configuration Manuelle Directe

Exécutez ces commandes **une par une** sur le serveur :

### Étape 1: Générer la Clé SSH

```bash
ssh-keygen -t ed25519 -C "votre-email@example.com"
```

- Appuyez sur **Entrée** pour accepter l'emplacement par défaut
- Entrez un mot de passe (ou laissez vide)
- Confirmez le mot de passe

### Étape 2: Afficher la Clé Publique

```bash
cat ~/.ssh/id_ed25519.pub
```

**📋 COPIEZ TOUT LE CONTENU** qui s'affiche (commence par `ssh-ed25519` et se termine par votre email).

### Étape 3: Ajouter la Clé sur GitHub

1. **Ouvrez votre navigateur** et allez sur : https://github.com/settings/keys
2. **Cliquez sur "New SSH key"** (ou "Add SSH key")
3. **Titre** : "Serveur SocialHub" (ou n'importe quel nom)
4. **Collez la clé publique** que vous avez copiée
5. **Cliquez sur "Add SSH key"**

### Étape 4: Tester la Connexion SSH

```bash
ssh -T git@github.com
```

Vous devriez voir :
```
Hi web483! You've successfully authenticated, but GitHub does not provide shell access.
```

✅ Si vous voyez cela, c'est bon !

### Étape 5: Configurer Git pour Utiliser SSH

```bash
cd /root/socialhub_global_v5
git remote set-url origin git@github.com:web483/socialhub_global_v5.git
```

### Étape 6: Tester le Pull

```bash
git pull origin main
```

Maintenant ça devrait fonctionner ! ✅

---

## 📋 Résumé des Commandes (Copier-Coller)

```bash
# 1. Générer la clé
ssh-keygen -t ed25519 -C "votre-email@example.com"
# (Appuyez sur Entrée 3 fois pour accepter les valeurs par défaut)

# 2. Afficher la clé publique (COPIEZ TOUT)
cat ~/.ssh/id_ed25519.pub

# 3. Ajoutez la clé sur https://github.com/settings/keys

# 4. Tester
ssh -T git@github.com

# 5. Configurer Git
cd /root/socialhub_global_v5
git remote set-url origin git@github.com:web483/socialhub_global_v5.git

# 6. Tester le pull
git pull origin main
```

---

## 🔄 Alternative : Utiliser HTTPS Temporairement

Si vous voulez récupérer le script d'abord avec HTTPS :

```bash
cd /root/socialhub_global_v5

# Changer temporairement pour HTTPS
git remote set-url origin https://github.com/web483/socialhub_global_v5.git

# Pull avec HTTPS (vous devrez entrer vos identifiants GitHub)
git pull origin main

# Maintenant vous avez le script, configurez SSH
chmod +x setup-ssh-github.sh
./setup-ssh-github.sh

# Puis remettez SSH
git remote set-url origin git@github.com:web483/socialhub_global_v5.git
```

---

## ⚠️ Note

Une fois SSH configuré, vous pourrez utiliser `git pull` et `./deploy.sh` sans problème ! 🎉

