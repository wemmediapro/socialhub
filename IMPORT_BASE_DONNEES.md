# Import de la base de données MongoDB

## Quelle base utiliser ? (La base la plus complète)

- **Une seule base** est utilisée par l’app : **`socialhub`** (définie dans `MONGODB_URI`).
- **La base la plus complète** est en général :
  - **Sur le serveur de production** (VPS 31.97.199.38) : c’est celle qui contient les données réelles (utilisateurs, projets, posts, etc.). Pour l’avoir en local, il faut l’exporter depuis le VPS puis l’importer.
  - **En local** : la base pointée par ton `.env` (`MONGODB_URI=mongodb://localhost:27017/socialhub`) après un import.
- **Pour utiliser le backup le plus complet / le plus récent** :
  - Place tous tes dumps dans le dossier **`backups/`** à la racine du projet (fichiers `backup_YYYYMMDD_HHMMSS.tar.gz`).
  - Lance **`./import-mongodb.sh`** sans argument : le script choisit automatiquement **le dernier** backup (le plus récent par date).
  - Pour forcer un fichier précis : `./import-mongodb.sh backups/backup_20250101_120000.tar.gz`

**Récupérer la base du serveur (la plus complète en prod) :**
- Sur le VPS : faire un `mongodump` (ou utiliser `scripts/mongo-install-and-migrate.sh` qui exporte la base locale puis la pousse sur le VPS).
- Depuis le VPS vers ta machine : exporter avec `mongodump --uri="mongodb://127.0.0.1:27017/socialhub" --out=./socialhub-dump`, puis récupérer le dossier `socialhub-dump` par SCP/rsync, le compresser en `backup_YYYYMMDD_HHMMSS.tar.gz`, le mettre dans `backups/` et lancer `./import-mongodb.sh`.

---

## Prérequis

- **MongoDB** en cours d’exécution (Docker ou local sur `localhost:27017`)
- Un **dump** au format :
  - soit un fichier `backup_YYYYMMDD_HHMMSS.tar.gz` (export du script `backup-mongodb.sh`),
  - soit un dossier contenant une sous-dossier `socialhub/` avec les fichiers `.bson` et `.metadata.json`

## Méthode 1 : Script automatique (recommandé)

```bash
# 1. Placez votre fichier backup dans le dossier backups/
cp /chemin/vers/backup_20250101_120000.tar.gz backups/

# 2. Lancez l’import (utilise le dernier backup_*.tar.gz trouvé)
./import-mongodb.sh
```

Avec un fichier ou un dossier précis :

```bash
# Fichier .tar.gz
./import-mongodb.sh backups/backup_20250101_120000.tar.gz

# Dossier déjà décompressé (contenant socialhub/)
./import-mongodb.sh /chemin/vers/dossier_dump
```

Le script :

- détecte si MongoDB tourne dans Docker (socialv7, socialhub_global_v5/v6/v7) et utilise le conteneur,
- sinon utilise `mongorestore` en local avec `MONGODB_URI` et la base `socialhub`.

## Méthode 2 : Restauration manuelle (Docker)

Si MongoDB tourne dans un conteneur Docker :

```bash
# Décompresser le backup
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz

# Adapter le nom du conteneur (voir avec: docker ps)
CONTAINER="socialhub_global_v6-mongo-1"   # ou socialv7-mongo-1, etc.

# Copier puis restaurer
docker cp backup_YYYYMMDD_HHMMSS $CONTAINER:/tmp/restore
docker exec $CONTAINER mongorestore --drop /tmp/restore
docker exec $CONTAINER rm -rf /tmp/restore
```

## Méthode 3 : Restauration manuelle (MongoDB local)

Si `mongorestore` est installé (MongoDB Database Tools) et MongoDB écoute en local :

```bash
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz
mongorestore --uri="mongodb://localhost:27017" --db=socialhub --drop backup_YYYYMMDD_HHMMSS
```

## Où récupérer un backup ?

- **Depuis le serveur** : voir `GUIDE_TELECHARGEMENT_BACKUP.md` (SCP, WinSCP, script PowerShell).
- **Créer un backup** : sur le serveur, `./backup-mongodb.sh` (voir `backup-mongodb.sh`).

## Dépannage

| Problème | Solution |
|----------|----------|
| `mongorestore introuvable` | Installez [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools) ou utilisez un conteneur Docker pour MongoDB. |
| `Le conteneur MongoDB n'est pas actif` | Démarrez MongoDB : `docker-compose up -d` dans le projet. |
| `Authentication failed` | Si votre MongoDB exige une authentification, configurez `MONGODB_URI` avec identifiants (ex. `mongodb://admin:admin123@localhost:27017/socialhub?authSource=admin`) et adaptez le script ou les commandes `docker exec` avec `--username` / `--password`. |
