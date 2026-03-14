@echo off
REM Script d'arrêt pour Windows (wrapper pour PowerShell)
REM SocialHub Global V5

echo.
echo 🛑 Arrêt de SocialHub Global V5...
echo.

REM Exécuter le script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0stop.ps1"

pause


