@echo off
echo ========================================
echo   PRD Automation - Backend Server
echo ========================================
echo.

cd /d "%~dp0"

REM Arrêter les processus Node sur le port 3000
echo Nettoyage du port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

timeout /t 1 /nobreak >nul

echo Demarrage du serveur...
echo.
npm run dev

pause
