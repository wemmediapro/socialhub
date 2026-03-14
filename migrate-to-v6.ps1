# Script de migration de v5 vers v6 avec backup de la base de données
# Usage: .\migrate-to-v6.ps1

Write-Host "🔄 Migration de socialhub_global_v5 vers socialhub_global_v6" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

$v5Path = "D:\Users\Lilia\Desktop\Cursor\socialhub_global_v5"
$v6Path = "D:\Users\Lilia\Desktop\Cursor\socialhub_global_v6"

# Vérifier que les dossiers existent
if (-not (Test-Path $v5Path)) {
    Write-Host "❌ Erreur: Le dossier v5 n'existe pas: $v5Path" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $v6Path)) {
    Write-Host "❌ Erreur: Le dossier v6 n'existe pas: $v6Path" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Étapes de la migration:" -ForegroundColor Cyan
Write-Host "  1. Backup de la base de données (à faire sur le serveur)" -ForegroundColor White
Write-Host "  2. Copie du contenu de v6 vers v5" -ForegroundColor White
Write-Host "  3. Commit et push vers Git" -ForegroundColor White
Write-Host ""

# Demander confirmation
$confirmation = Read-Host "⚠️  Cette opération va remplacer tout le contenu de v5 par v6. Continuer? (oui/non)"
if ($confirmation -ne "oui") {
    Write-Host "❌ Migration annulée" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📝 Étape 1: Instructions pour le backup de la base de données" -ForegroundColor Yellow
Write-Host "==============================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Sur le serveur, exécutez les commandes suivantes:" -ForegroundColor White
Write-Host ""
Write-Host "  # Se connecter au serveur" -ForegroundColor Cyan
Write-Host "  ssh user@votre-serveur" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Aller dans le dossier de l'application" -ForegroundColor Cyan
Write-Host "  cd /root/socialhub_global_v5" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Copier le script de backup depuis v6 (si pas déjà présent)" -ForegroundColor Cyan
Write-Host "  # Ou utiliser le script existant:" -ForegroundColor Cyan
Write-Host "  ./backup-mongodb.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # OU créer un backup manuel:" -ForegroundColor Cyan
Write-Host "  docker exec socialhub_global_v5-mongo-1 mongodump --out=/tmp/backup" -ForegroundColor Cyan
Write-Host "  docker cp socialhub_global_v5-mongo-1:/tmp/backup ./backup_$(date +%Y%m%d_%H%M%S)" -ForegroundColor Cyan
Write-Host ""

$backupDone = Read-Host "✅ Avez-vous fait le backup de la base de données sur le serveur? (oui/non)"
if ($backupDone -ne "oui") {
    Write-Host "⚠️  Veuillez d'abord faire le backup avant de continuer!" -ForegroundColor Yellow
    Write-Host "   Le script s'arrête ici pour votre sécurité." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "📦 Étape 2: Copie du contenu de v6 vers v5" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""

# Liste des fichiers/dossiers à exclure lors de la copie
$excludeItems = @(
    "node_modules",
    ".next",
    ".git",
    "mongodb_data",
    "logs",
    "*.log",
    ".env",
    ".env.local",
    "backup_*",
    "*.rar",
    "*.zip",
    "redis-stable",
    "redis-stable.tar.gz"
)

Write-Host "📂 Copie des fichiers (exclusion de node_modules, .next, .git, etc.)..." -ForegroundColor Cyan

# Aller dans le dossier v5
Set-Location $v5Path

# Sauvegarder le .git actuel
Write-Host "💾 Sauvegarde du dossier .git..." -ForegroundColor Cyan
if (Test-Path ".git") {
    Copy-Item -Path ".git" -Destination ".git.backup" -Recurse -Force
}

# Copier les fichiers de v6 vers v5
Write-Host "📋 Copie des fichiers depuis v6..." -ForegroundColor Cyan

# Obtenir tous les fichiers et dossiers de v6
$items = Get-ChildItem -Path $v6Path -Force

foreach ($item in $items) {
    $itemName = $item.Name
    
    # Ignorer les éléments à exclure
    $shouldExclude = $false
    foreach ($exclude in $excludeItems) {
        if ($itemName -like $exclude) {
            $shouldExclude = $true
            break
        }
    }
    
    if ($shouldExclude) {
        Write-Host "  ⏭️  Ignoré: $itemName" -ForegroundColor Gray
        continue
    }
    
    # Copier l'élément
    $destination = Join-Path $v5Path $itemName
    if ($item.PSIsContainer) {
        if (Test-Path $destination) {
            Remove-Item -Path $destination -Recurse -Force
        }
        Copy-Item -Path $item.FullName -Destination $destination -Recurse -Force
        Write-Host "  ✅ Copié: $itemName/" -ForegroundColor Green
    } else {
        Copy-Item -Path $item.FullName -Destination $destination -Force
        Write-Host "  ✅ Copié: $itemName" -ForegroundColor Green
    }
}

# Restaurer le .git
Write-Host ""
Write-Host "🔄 Restauration du dossier .git..." -ForegroundColor Cyan
if (Test-Path ".git.backup") {
    if (Test-Path ".git") {
        Remove-Item -Path ".git" -Recurse -Force
    }
    Move-Item -Path ".git.backup" -Destination ".git" -Force
    Write-Host "  ✅ .git restauré" -ForegroundColor Green
}

Write-Host ""
Write-Host "📊 Étape 3: Vérification Git" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow
Write-Host ""

# Vérifier le statut Git
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "📝 Fichiers modifiés détectés:" -ForegroundColor Cyan
    Write-Host $gitStatus -ForegroundColor White
    Write-Host ""
    
    $commit = Read-Host "Voulez-vous commiter et pousser ces changements maintenant? (oui/non)"
    if ($commit -eq "oui") {
        Write-Host ""
        Write-Host "📤 Ajout des fichiers à Git..." -ForegroundColor Cyan
        git add -A
        
        Write-Host "💾 Création du commit..." -ForegroundColor Cyan
        $commitMessage = "feat: migration vers v6 - remplacement complet de l'application"
        git commit -m $commitMessage
        
        Write-Host "🚀 Push vers le dépôt distant..." -ForegroundColor Cyan
        git push
        
        Write-Host ""
        Write-Host "✅ Migration terminée avec succès!" -ForegroundColor Green
        Write-Host "==================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Prochaines étapes sur le serveur:" -ForegroundColor Yellow
        Write-Host "  1. Se connecter au serveur" -ForegroundColor White
        Write-Host "  2. Aller dans /home/socialhub/socialhub_global_v5" -ForegroundColor White
        Write-Host "  3. Exécuter: git pull" -ForegroundColor White
        Write-Host "  4. Exécuter: ./deploy.sh" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "ℹ️  Les fichiers ont été copiés mais pas committés." -ForegroundColor Yellow
        Write-Host "   Vous pouvez le faire manuellement plus tard." -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "ℹ️  Aucun changement détecté dans Git." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "✅ Migration locale terminée!" -ForegroundColor Green
Write-Host ""

