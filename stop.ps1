# Script d'arrêt pour Windows
# SocialHub Global V5 - Arrêt de tous les services

Write-Host ""
Write-Host "🛑 Arrêt de SocialHub Global V5..." -ForegroundColor Yellow
Write-Host ""

# Arrêter les processus Next.js
Write-Host "🛑 Arrêt de Next.js..." -ForegroundColor Yellow
$nextProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node_modules*next*" -or $_.CommandLine -like "*next dev*" }
if ($nextProcesses) {
    $nextProcesses | Stop-Process -Force
    Write-Host "✅ Next.js arrêté" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun processus Next.js trouvé" -ForegroundColor Gray
}

# Arrêter les processus tsx (workers)
Write-Host "🛑 Arrêt des workers..." -ForegroundColor Yellow
$tsxProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*tsx*" }
if ($tsxProcesses) {
    $tsxProcesses | Stop-Process -Force
    Write-Host "✅ Workers arrêtés" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun worker trouvé" -ForegroundColor Gray
}

# Arrêter les conteneurs Docker
Write-Host "🛑 Arrêt des conteneurs Docker..." -ForegroundColor Yellow
try {
    docker-compose stop
    Write-Host "✅ Conteneurs Docker arrêtés" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erreur lors de l'arrêt des conteneurs Docker" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Tous les services sont arrêtés!" -ForegroundColor Green
Write-Host ""


