@echo off
REM Script de démarrage pour Windows (wrapper pour PowerShell)
REM SocialHub Global V5

echo.
echo 🚀 Démarrage de SocialHub Global V5...
echo.

REM Vérifier si PowerShell est disponible
powershell -Command "& {Get-Command powershell -ErrorAction SilentlyContinue}" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PowerShell n'est pas disponible!
    echo 💡 Veuillez utiliser start.ps1 directement
    pause
    exit /b 1
)

REM Exécuter le script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0start.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erreur lors du démarrage!
    pause
    exit /b 1
)

pause


