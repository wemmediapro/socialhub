# Script PowerShell pour télécharger les backups MongoDB du serveur
# Usage: .\download-backup.ps1

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "",
    [string]$BackupPath = "/root/backups/mongodb",
    [string]$LocalPath = ".\backups",
    [string]$LatestOnly = $false
)

Write-Host "📥 Téléchargement des backups MongoDB depuis le serveur" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Yellow
Write-Host ""

# Vérifier que l'hôte du serveur est spécifié
if ([string]::IsNullOrEmpty($ServerHost)) {
    $ServerHost = Read-Host "Entrez l'adresse IP ou le nom d'hôte du serveur"
}

if ([string]::IsNullOrEmpty($ServerHost)) {
    Write-Host "❌ Erreur: L'adresse du serveur est requise" -ForegroundColor Red
    exit 1
}

# Créer le dossier local s'il n'existe pas
if (-not (Test-Path $LocalPath)) {
    New-Item -ItemType Directory -Path $LocalPath -Force | Out-Null
    Write-Host "✅ Dossier créé: $LocalPath" -ForegroundColor Green
}

Write-Host "🔗 Serveur: $ServerUser@$ServerHost" -ForegroundColor Cyan
Write-Host "📂 Chemin serveur: $BackupPath" -ForegroundColor Cyan
Write-Host "📂 Chemin local: $LocalPath" -ForegroundColor Cyan
Write-Host ""

# Vérifier si SCP est disponible (via OpenSSH)
$scpAvailable = $false
try {
    $null = Get-Command scp -ErrorAction Stop
    $scpAvailable = $true
} catch {
    Write-Host "⚠️  SCP n'est pas disponible. Installation d'OpenSSH..." -ForegroundColor Yellow
    
    # Essayer d'installer OpenSSH (Windows 10/11)
    try {
        Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0 -ErrorAction Stop
        Write-Host "✅ OpenSSH installé" -ForegroundColor Green
        $scpAvailable = $true
    } catch {
        Write-Host "❌ Impossible d'installer OpenSSH automatiquement." -ForegroundColor Red
        Write-Host "   Veuillez installer OpenSSH manuellement ou utiliser WinSCP/FileZilla" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 Alternative: Utilisez WinSCP ou FileZilla avec ces paramètres:" -ForegroundColor Cyan
        Write-Host "   Protocole: SFTP" -ForegroundColor White
        Write-Host "   Hôte: $ServerHost" -ForegroundColor White
        Write-Host "   Utilisateur: $ServerUser" -ForegroundColor White
        Write-Host "   Chemin: $BackupPath" -ForegroundColor White
        exit 1
    }
}

if ($scpAvailable) {
    Write-Host "📋 Liste des backups disponibles sur le serveur:" -ForegroundColor Cyan
    
    # Lister les backups sur le serveur
    $backupList = ssh "$ServerUser@$ServerHost" "ls -1t $BackupPath/*.tar.gz 2>/dev/null | head -10"
    
    if ([string]::IsNullOrEmpty($backupList)) {
        Write-Host "⚠️  Aucun backup trouvé sur le serveur" -ForegroundColor Yellow
        Write-Host "   Vérifiez que le chemin est correct: $BackupPath" -ForegroundColor Yellow
        exit 1
    }
    
    $backups = $backupList -split "`n" | Where-Object { $_ -match "backup_.*\.tar\.gz" }
    
    if ($backups.Count -eq 0) {
        Write-Host "⚠️  Aucun backup trouvé" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
    for ($i = 0; $i -lt $backups.Count; $i++) {
        $backup = $backups[$i].Trim()
        $fileName = Split-Path -Leaf $backup
        Write-Host "  $($i + 1). $fileName" -ForegroundColor White
    }
    Write-Host ""
    
    if ($LatestOnly) {
        $selectedBackup = $backups[0].Trim()
        Write-Host "📥 Téléchargement du dernier backup: $(Split-Path -Leaf $selectedBackup)" -ForegroundColor Cyan
    } else {
        $choice = Read-Host "Quel backup voulez-vous télécharger? (numéro ou 'all' pour tous, 'latest' pour le dernier)"
        
        if ($choice -eq "all") {
            $selectedBackups = $backups
        } elseif ($choice -eq "latest" -or $choice -eq "1") {
            $selectedBackups = @($backups[0])
        } elseif ([int]$choice -ge 1 -and [int]$choice -le $backups.Count) {
            $selectedBackups = @($backups[[int]$choice - 1])
        } else {
            Write-Host "❌ Choix invalide" -ForegroundColor Red
            exit 1
        }
    }
    
    # Télécharger les backups sélectionnés
    foreach ($backup in $selectedBackups) {
        $backup = $backup.Trim()
        $fileName = Split-Path -Leaf $backup
        $localFile = Join-Path $LocalPath $fileName
        
        Write-Host ""
        Write-Host "📥 Téléchargement: $fileName" -ForegroundColor Cyan
        Write-Host "   De: $ServerUser@$ServerHost:$backup" -ForegroundColor Gray
        Write-Host "   Vers: $localFile" -ForegroundColor Gray
        
        # Télécharger avec SCP
        scp "$ServerUser@$ServerHost`:$backup" $localFile
        
        if (Test-Path $localFile) {
            $fileSize = (Get-Item $localFile).Length / 1MB
            Write-Host "✅ Téléchargé: $fileName ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
        } else {
            Write-Host "❌ Erreur lors du téléchargement de $fileName" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "✅ Téléchargement terminé!" -ForegroundColor Green
    Write-Host "📂 Fichiers sauvegardés dans: $LocalPath" -ForegroundColor Cyan
    Write-Host ""
    
    # Ouvrir le dossier
    $openFolder = Read-Host "Voulez-vous ouvrir le dossier des backups? (o/n)"
    if ($openFolder -eq "o" -or $openFolder -eq "O") {
        Invoke-Item $LocalPath
    }
} else {
    Write-Host "❌ SCP n'est pas disponible" -ForegroundColor Red
}

