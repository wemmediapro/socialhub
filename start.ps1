# Script de demarrage automatique pour Windows
# SocialHub Global V5 - Demarrage complet

Write-Host ""
Write-Host "Demarrage de SocialHub Global V5..." -ForegroundColor Cyan
Write-Host ""

# Fonction pour verifier si un port est ouvert
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    } catch {
        return $false
    }
}

# Verifier si Docker est installe et en cours d'execution
Write-Host "Verification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker n'est pas installe ou n'est pas en cours d'execution!" -ForegroundColor Red
        Write-Host "Veuillez installer Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "Docker detecte: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker n'est pas installe!" -ForegroundColor Red
    exit 1
}

# Verifier et demarrer MongoDB
Write-Host ""
Write-Host "Verification de MongoDB..." -ForegroundColor Yellow
if (Test-Port -Port 27017) {
    Write-Host "MongoDB est deja en cours d'execution sur le port 27017" -ForegroundColor Green
} else {
    Write-Host "Demarrage de MongoDB avec Docker..." -ForegroundColor Yellow
    docker-compose up -d mongo
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Attente que MongoDB soit pret..." -ForegroundColor Yellow
        $retries = 0
        $maxRetries = 30
        while ($retries -lt $maxRetries) {
            Start-Sleep -Seconds 2
            if (Test-Port -Port 27017) {
                Write-Host "MongoDB est pret!" -ForegroundColor Green
                break
            }
            $retries++
            Write-Host "   Tentative $retries/$maxRetries..." -ForegroundColor Gray
        }
        if ($retries -eq $maxRetries) {
            Write-Host "MongoDB n'a pas demarre correctement!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Erreur lors du demarrage de MongoDB!" -ForegroundColor Red
        exit 1
    }
}

# Verifier et demarrer Redis
Write-Host ""
Write-Host "Verification de Redis..." -ForegroundColor Yellow
if (Test-Port -Port 6379) {
    Write-Host "Redis est deja en cours d'execution sur le port 6379" -ForegroundColor Green
} else {
    Write-Host "Demarrage de Redis avec Docker..." -ForegroundColor Yellow
    docker-compose up -d redis
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Attente que Redis soit pret..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        if (Test-Port -Port 6379) {
            Write-Host "Redis est pret!" -ForegroundColor Green
        } else {
            Write-Host "Redis pourrait ne pas etre completement pret, mais continuons..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Erreur lors du demarrage de Redis!" -ForegroundColor Red
        exit 1
    }
}

# Verifier le fichier .env
Write-Host ""
Write-Host "Verification de la configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "Fichier .env trouve" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    if ($envContent -notmatch "MONGODB_URI") {
        Write-Host "MONGODB_URI non trouve dans .env" -ForegroundColor Yellow
        Write-Host "Ajoutez: MONGODB_URI=mongodb://localhost:27017/socialhub" -ForegroundColor Yellow
    } else {
        Write-Host "MONGODB_URI configure" -ForegroundColor Green
    }
} else {
    Write-Host "Fichier .env non trouve!" -ForegroundColor Yellow
    Write-Host "Creation du fichier .env a partir du template..." -ForegroundColor Yellow
    if (Test-Path "env.template") {
        Copy-Item "env.template" ".env"
        Write-Host "Fichier .env cree. Veuillez le configurer si necessaire." -ForegroundColor Green
    } else {
        Write-Host "Template env.template non trouve!" -ForegroundColor Red
    }
}

# Creer le dossier logs s'il n'existe pas
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
    Write-Host "Dossier logs cree" -ForegroundColor Green
}

# Creer le dossier public/uploads s'il n'existe pas
if (-not (Test-Path "public\uploads")) {
    New-Item -ItemType Directory -Path "public\uploads" | Out-Null
    Write-Host "Dossier public/uploads cree" -ForegroundColor Green
}

# Verifier si Node.js est installe
Write-Host ""
Write-Host "Verification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Node.js detecte: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js n'est pas installe!" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verifier si les dependances sont installees
Write-Host ""
Write-Host "Verification des dependances..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances npm..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de l'installation des dependances!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependances installees" -ForegroundColor Green
} else {
    Write-Host "Dependances deja installees" -ForegroundColor Green
}

# Demarrer Next.js
Write-Host ""
Write-Host "Demarrage de Next.js..." -ForegroundColor Yellow
Write-Host ""

# Afficher les informations finales
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Tous les services sont pret!" -ForegroundColor Green
Write-Host ""
Write-Host "Application: http://localhost:3000" -ForegroundColor Cyan
Write-Host "MongoDB: localhost:27017" -ForegroundColor Cyan
Write-Host "Redis: localhost:6379" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour arreter l'application: Ctrl+C" -ForegroundColor Yellow
Write-Host "Pour arreter tous les services: .\stop.ps1" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Demarrer Next.js (en avant-plan pour voir les logs)
npm run dev
