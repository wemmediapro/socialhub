# Guide de Migration vers V6

Ce guide vous explique comment migrer de `socialhub_global_v5` vers `socialhub_global_v6` en toute sécurité avec backup de la base de données.

## 📋 Prérequis

- Accès au serveur (SSH)
- Les deux versions (v5 et v6) disponibles localement
- Git configuré et connecté au dépôt distant

## 🔄 Processus de Migration

### Étape 1: Backup de la Base de Données (SUR LE SERVEUR)

**⚠️ IMPORTANT: Faites cette étape AVANT toute modification!**

1. Connectez-vous au serveur:
```bash
ssh user@votre-serveur
```

2. Allez dans le dossier de l'application:
```bash
cd /home/socialhub/socialhub_global_v5
```

3. Exécutez le script de backup:
```bash
# Si le script existe déjà
./backup-mongodb.sh

# OU backup manuel
docker exec socialhub_global_v5-mongo-1 mongodump --out=/tmp/backup
docker cp socialhub_global_v5-mongo-1:/tmp/backup ./backup_$(date +%Y%m%d_%H%M%S)
docker exec socialhub_global_v5-mongo-1 rm -rf /tmp/backup
```

4. Vérifiez que le backup a été créé:
```bash
ls -lh backup_*
```

### Étape 2: Migration Locale (SUR VOTRE MACHINE)

1. Ouvrez PowerShell dans le dossier v5:
```powershell
cd D:\Users\Lilia\Desktop\Cursor\socialhub_global_v5
```

2. Exécutez le script de migration:
```powershell
.\migrate-to-v6.ps1
```

Le script va:
- ✅ Copier tous les fichiers de v6 vers v5 (en excluant node_modules, .git, etc.)
- ✅ Préserver votre historique Git
- ✅ Vous proposer de commiter et pousser les changements

### Étape 3: Déploiement sur le Serveur

1. Connectez-vous au serveur:
```bash
ssh user@votre-serveur
```

2. Allez dans le dossier de l'application:
```bash
cd /home/socialhub/socialhub_global_v5
```

3. Récupérez les dernières modifications:
```bash
git pull origin main
```

4. Le script `deploy.sh` fera automatiquement un backup avant de déployer, mais vous pouvez aussi le faire manuellement:
```bash
./backup-mongodb.sh
```

5. Déployez la nouvelle version:
```bash
./deploy.sh
```

Le script `deploy.sh` va:
- ✅ Faire un backup automatique de la base de données
- ✅ Récupérer les dernières modifications Git
- ✅ Installer les dépendances
- ✅ Builder l'application
- ✅ Redémarrer les services PM2

## 🔙 Restauration en Cas de Problème

Si quelque chose ne fonctionne pas après la migration:

1. Arrêtez l'application:
```bash
pm2 stop all
```

2. Restaurez le backup:
```bash
cd /home/socialhub/backups/mongodb
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz
docker cp backup_YYYYMMDD_HHMMSS socialhub_global_v5-mongo-1:/tmp/restore
docker exec socialhub_global_v5-mongo-1 mongorestore /tmp/restore
```

3. Revenez à l'ancienne version Git:
```bash
cd /home/socialhub/socialhub_global_v5
git log  # Trouvez le commit avant la migration
git checkout <commit-hash>
./deploy.sh
```

## 📝 Notes Importantes

- ⚠️ **Toujours faire un backup avant de migrer**
- ⚠️ **Tester en local si possible avant de déployer**
- ⚠️ **Garder les backups pendant au moins 7 jours**
- ✅ Le script `deploy.sh` fait maintenant un backup automatique avant chaque déploiement

## 🆘 Support

En cas de problème:
1. Vérifiez les logs: `pm2 logs`
2. Vérifiez le statut: `pm2 status`
3. Vérifiez les logs Docker: `docker-compose logs`
4. Consultez les backups disponibles: `ls -lh /home/socialhub/backups/mongodb/`

