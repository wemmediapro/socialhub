# 📋 Commandes à Exécuter sur le Serveur

## Étape 1: Résoudre le Conflit Git

Copiez-collez ces commandes une par une dans votre terminal SSH :

```bash
# Aller dans le dossier de l'application
cd /root/socialhub_global_v5

# Écraser les modifications locales avec la version distante
git checkout -- backup-mongodb.sh
git checkout -- deploy.sh

# Récupérer les dernières modifications
git pull origin main

# Rendre les scripts exécutables
chmod +x backup-mongodb.sh deploy.sh fix-git-conflict-serveur.sh
```

## Étape 2: Vérifier que Tout est Correct

```bash
# Vérifier les chemins dans deploy.sh
grep "APP_DIR" deploy.sh
# Devrait afficher: APP_DIR="/root/socialhub_global_v5"

# Vérifier les chemins dans backup-mongodb.sh
grep "BACKUP_DIR" backup-mongodb.sh
# Devrait afficher: BACKUP_DIR="/root/backups/mongodb"

# Vérifier le statut Git
git status
# Devrait afficher: "Your branch is up to date with 'origin/main'"
```

## Étape 3: Tester le Backup (Optionnel mais Recommandé)

```bash
# Tester le script de backup
./backup-mongodb.sh
```

Si le backup fonctionne, vous verrez un message de succès avec le nom du fichier de backup créé.

## ✅ C'est Terminé !

Une fois ces étapes terminées, vous pouvez :
- Continuer avec la migration vers v6 (si vous êtes prêt)
- Ou simplement utiliser les scripts corrigés

---

## 🔄 Si Vous Voulez Continuer avec la Migration V6

Après avoir résolu le conflit, sur votre PC local :

```powershell
cd D:\Users\Lilia\Desktop\Cursor\socialhub_global_v5
.\migrate-to-v6.ps1
```

Puis sur le serveur :

```bash
cd /root/socialhub_global_v5
git pull origin main
./deploy.sh
```

