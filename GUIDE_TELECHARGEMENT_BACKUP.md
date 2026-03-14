# Guide de Téléchargement des Backups MongoDB

Ce guide vous explique comment télécharger les backups MongoDB du serveur vers votre PC local.

## 📋 Méthodes Disponibles

### Méthode 1: Script PowerShell (Recommandé)

Le script `download-backup.ps1` automatise le processus :

```powershell
# Télécharger le dernier backup
.\download-backup.ps1 -ServerHost "votre-serveur.com" -LatestOnly $true

# Télécharger un backup spécifique
.\download-backup.ps1 -ServerHost "votre-serveur.com"

# Personnaliser les chemins
.\download-backup.ps1 -ServerHost "votre-serveur.com" -ServerUser "root" -LocalPath ".\mes-backups"
```

**Paramètres:**
- `-ServerHost`: Adresse IP ou nom d'hôte du serveur (requis)
- `-ServerUser`: Utilisateur SSH (défaut: `root`)
- `-BackupPath`: Chemin des backups sur le serveur (défaut: `/root/backups/mongodb`)
- `-LocalPath`: Dossier local pour sauvegarder (défaut: `.\backups`)
- `-LatestOnly`: Télécharger uniquement le dernier backup (défaut: `$false`)

### Méthode 2: SCP en Ligne de Commande

Si vous avez OpenSSH installé (Windows 10/11) :

```powershell
# Lister les backups disponibles
ssh root@votre-serveur.com "ls -lh /root/backups/mongodb/*.tar.gz"

# Télécharger le dernier backup
scp root@votre-serveur.com:/root/backups/mongodb/backup_*.tar.gz .\backups\
```

**Installation OpenSSH sur Windows:**
```powershell
# En tant qu'administrateur
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### Méthode 3: WinSCP (Interface Graphique)

1. Téléchargez et installez [WinSCP](https://winscp.net/)
2. Créez une nouvelle session avec ces paramètres:
   - **Protocole:** SFTP
   - **Nom d'hôte:** Votre adresse serveur
   - **Nom d'utilisateur:** `root` (ou votre utilisateur)
   - **Mot de passe:** Votre mot de passe SSH
3. Connectez-vous
4. Naviguez vers `/root/backups/mongodb`
5. Téléchargez les fichiers `.tar.gz` vers votre PC

### Méthode 4: FileZilla (Interface Graphique)

1. Téléchargez et installez [FileZilla](https://filezilla-project.org/)
2. Créez une nouvelle connexion:
   - **Protocole:** SFTP
   - **Hôte:** Votre adresse serveur
   - **Utilisateur:** `root` (ou votre utilisateur)
   - **Mot de passe:** Votre mot de passe SSH
3. Connectez-vous
4. Naviguez vers `/root/backups/mongodb`
5. Glissez-déposez les fichiers `.tar.gz` vers votre PC

## 🔍 Trouver le Dernier Backup

Sur le serveur, pour trouver le dernier backup:

```bash
ls -lht /root/backups/mongodb/*.tar.gz | head -1
```

## 📦 Structure des Backups

Les backups sont nommés avec un timestamp:
- Format: `backup_YYYYMMDD_HHMMSS.tar.gz`
- Exemple: `backup_20251124_151214.tar.gz`

## 🔐 Authentification SSH

### Avec mot de passe:
Le script vous demandera le mot de passe lors de la connexion.

### Avec clé SSH (Recommandé pour la sécurité):

1. Générez une clé SSH sur votre PC:
```powershell
ssh-keygen -t rsa -b 4096
```

2. Copiez la clé publique sur le serveur:
```powershell
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@votre-serveur.com "cat >> ~/.ssh/authorized_keys"
```

3. Testez la connexion:
```powershell
ssh root@votre-serveur.com
```

## 📝 Exemple Complet

```powershell
# 1. Créer le dossier local
New-Item -ItemType Directory -Path ".\backups" -Force

# 2. Télécharger avec le script
.\download-backup.ps1 -ServerHost "192.168.1.100" -LatestOnly $true

# 3. Ou manuellement avec SCP
scp root@192.168.1.100:/root/backups/mongodb/backup_20251124_151214.tar.gz .\backups\
```

## ⚠️ Notes Importantes

- Les backups peuvent être volumineux (plusieurs centaines de MB)
- Assurez-vous d'avoir assez d'espace disque
- Les backups sont compressés (format `.tar.gz`)
- Gardez plusieurs backups pour la sécurité

## 🔄 Restauration d'un Backup

Pour restaurer un backup sur le serveur, voir `backup-mongodb.sh` ou `MIGRATION_V6.md`.

