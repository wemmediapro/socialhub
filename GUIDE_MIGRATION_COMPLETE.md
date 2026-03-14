# Guide Complet de Migration V5 → V6

Ce guide vous explique **étape par étape** comment migrer de `socialhub_global_v5` vers `socialhub_global_v6` après avoir fait le backup de la base de données.

## 📋 Checklist Pré-Migration

- [x] Backup de la base de données fait sur le serveur
- [ ] Migration locale (copie v6 → v5)
- [ ] Commit et push vers Git
- [ ] Déploiement sur le serveur
- [ ] Vérification que tout fonctionne

---

## 🔄 Étape 1: Backup de la Base de Données (DÉJÀ FAIT ✅)

Vous avez déjà fait le backup sur le serveur. Vérifiez qu'il existe :

```bash
# Sur le serveur
ls -lh /root/backups/mongodb/backup_*.tar.gz
```

**✅ Si le backup existe, vous pouvez continuer !**

---

## 💻 Étape 2: Migration Locale (Sur Votre PC)

### Option A: Script Automatique (Recommandé)

1. **Ouvrez PowerShell** dans le dossier v5 :
```powershell
cd D:\Users\Lilia\Desktop\Cursor\socialhub_global_v5
```

2. **Exécutez le script de migration** :
```powershell
.\migrate-to-v6.ps1
```

3. **Le script va** :
   - Vous demander confirmation
   - Vous rappeler de vérifier le backup
   - Copier tous les fichiers de v6 vers v5
   - Préserver votre historique Git
   - Vous proposer de commiter et pousser

### Option B: Migration Manuelle

Si vous préférez faire la migration manuellement :

```powershell
# 1. Aller dans le dossier v5
cd D:\Users\Lilia\Desktop\Cursor\socialhub_global_v5

# 2. Sauvegarder le dossier .git
Copy-Item -Path ".git" -Destination ".git.backup" -Recurse -Force

# 3. Copier les fichiers de v6 (exclure node_modules, .next, .git)
$v6Path = "D:\Users\Lilia\Desktop\Cursor\socialhub_global_v6"
$items = Get-ChildItem -Path $v6Path -Force | Where-Object {
    $_.Name -notmatch "node_modules|\.next|\.git|mongodb_data|logs|\.log|\.env|backup_|\.rar|\.zip|redis-stable"
}

foreach ($item in $items) {
    $destination = Join-Path (Get-Location) $item.Name
    if ($item.PSIsContainer) {
        if (Test-Path $destination) { Remove-Item -Path $destination -Recurse -Force }
        Copy-Item -Path $item.FullName -Destination $destination -Recurse -Force
    } else {
        Copy-Item -Path $item.FullName -Destination $destination -Force
    }
}

# 4. Restaurer le .git
if (Test-Path ".git.backup") {
    if (Test-Path ".git") { Remove-Item -Path ".git" -Recurse -Force }
    Move-Item -Path ".git.backup" -Destination ".git" -Force
}
```

---

## 📤 Étape 3: Commit et Push vers Git

### Si vous avez utilisé le script automatique :

Le script vous proposera automatiquement de commiter. Répondez **"oui"** quand il vous le demande.

### Si vous faites la migration manuellement :

```powershell
# 1. Vérifier les changements
git status

# 2. Ajouter tous les fichiers
git add -A

# 3. Créer le commit
git commit -m "feat: migration vers v6 - remplacement complet de l'application"

# 4. Pousser vers le dépôt distant
git push origin main
```

---

## 🚀 Étape 4: Déploiement sur le Serveur

### 4.1. Résoudre les Conflits Git (si nécessaire)

Si vous avez des conflits Git sur le serveur :

```bash
# Sur le serveur
cd /root/socialhub_global_v5

# Option 1: Utiliser le script automatique
chmod +x fix-git-conflict.sh
./fix-git-conflict.sh

# Option 2: Écraser les modifications locales
git checkout -- backup-mongodb.sh
git pull origin main
chmod +x backup-mongodb.sh deploy.sh
```

### 4.2. Récupérer les Dernières Modifications

```bash
cd /root/socialhub_global_v5
git pull origin main
```

### 4.3. Déployer la Nouvelle Version

Le script `deploy.sh` va automatiquement :
- ✅ Faire un backup de la base de données (sécurité supplémentaire)
- ✅ Récupérer les dernières modifications Git
- ✅ Installer les dépendances
- ✅ Builder l'application
- ✅ Redémarrer les services PM2

```bash
cd /root/socialhub_global_v5
./deploy.sh
```

---

## ✅ Étape 5: Vérification Post-Migration

### 5.1. Vérifier les Services

```bash
# Statut PM2
pm2 status

# Logs de l'application
pm2 logs socialhub-app --lines 50

# Vérifier les services Docker
docker-compose ps
```

### 5.2. Tester l'Application

1. **Accédez à l'application** : `https://votre-domaine.com`
2. **Connectez-vous** avec vos identifiants
3. **Vérifiez les fonctionnalités principales** :
   - Dashboard
   - Calendrier
   - Workflow Posts
   - Workflow Collaborations
   - Statistiques
   - Bibliothèque médias

### 5.3. Vérifier la Base de Données

```bash
# Se connecter à MongoDB
docker exec -it socialhub_global_v5-mongo-1 mongosh -u admin -p admin123 --authenticationDatabase admin

# Dans MongoDB shell
use socialhub
show collections
db.posts.countDocuments()
db.collaborations.countDocuments()
```

---

## 🔙 Rollback en Cas de Problème

Si quelque chose ne fonctionne pas après la migration :

### 1. Arrêter l'Application

```bash
pm2 stop all
```

### 2. Restaurer le Backup de la Base de Données

```bash
cd /root/backups/mongodb
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz
docker cp backup_YYYYMMDD_HHMMSS socialhub_global_v5-mongo-1:/tmp/restore
docker exec socialhub_global_v5-mongo-1 mongorestore \
    --username=admin \
    --password=admin123 \
    --authenticationDatabase=admin \
    /tmp/restore
```

### 3. Revenir à l'Ancienne Version Git

```bash
cd /root/socialhub_global_v5
git log --oneline  # Trouver le commit avant la migration
git checkout <commit-hash-avant-migration>
./deploy.sh
```

---

## 📝 Résumé des Commandes

### Sur votre PC (Windows) :

```powershell
# 1. Migration locale
cd D:\Users\Lilia\Desktop\Cursor\socialhub_global_v5
.\migrate-to-v6.ps1

# 2. Si le script ne commit pas automatiquement
git add -A
git commit -m "feat: migration vers v6"
git push origin main
```

### Sur le serveur (Linux) :

```bash
# 1. Résoudre les conflits (si nécessaire)
cd /root/socialhub_global_v5
git checkout -- backup-mongodb.sh
git pull origin main
chmod +x backup-mongodb.sh deploy.sh

# 2. Déployer
./deploy.sh

# 3. Vérifier
pm2 status
pm2 logs socialhub-app --lines 20
```

---

## ⚠️ Points d'Attention

1. **Backup obligatoire** : Toujours faire un backup avant la migration
2. **Tester en local** : Si possible, tester la migration en local d'abord
3. **Heure de maintenance** : Faire la migration pendant une période de faible activité
4. **Garder les backups** : Conserver les backups pendant au moins 7 jours
5. **Documentation** : Noter les problèmes rencontrés pour référence future

---

## 🆘 Support

En cas de problème :

1. **Vérifier les logs** :
   ```bash
   pm2 logs
   docker-compose logs
   ```

2. **Vérifier le statut** :
   ```bash
   pm2 status
   docker-compose ps
   ```

3. **Consulter les backups** :
   ```bash
   ls -lh /root/backups/mongodb/
   ```

---

## ✅ Checklist Finale

- [ ] Backup de la base de données fait et vérifié
- [ ] Migration locale effectuée (v6 → v5)
- [ ] Changements committés et poussés vers Git
- [ ] Conflits Git résolus sur le serveur
- [ ] Déploiement effectué avec succès
- [ ] Services PM2 redémarrés
- [ ] Application accessible et fonctionnelle
- [ ] Base de données vérifiée
- [ ] Fonctionnalités principales testées

**🎉 Une fois tous les points cochés, la migration est terminée !**

