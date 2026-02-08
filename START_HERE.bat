@echo off
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║         PRD AUTOMATION - DEMARRAGE RAPIDE             ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo Ce script va ouvrir 2 fenetres :
echo   1. Backend  (serveur Express sur port 3000)
echo   2. Frontend (Vite dev sur port 5173)
echo.
echo Appuyez sur une touche pour continuer...
pause >nul

REM Ouvrir le backend dans une nouvelle fenêtre
start "PRD Backend" cmd /k "%~dp0start-backend.bat"

REM Attendre 3 secondes
timeout /t 3 /nobreak >nul

REM Ouvrir le frontend dans une nouvelle fenêtre
start "PRD Frontend" cmd /k "%~dp0start-frontend.bat"

REM Attendre 5 secondes
timeout /t 5 /nobreak >nul

REM Ouvrir le navigateur
echo.
echo Ouverture du navigateur...
start http://localhost:5173

echo.
echo ✅ Application demarree !
echo.
echo Frontend : http://localhost:5173
echo Backend  : http://localhost:3000
echo.
echo Fermez cette fenetre quand vous avez fini.
echo.
pause
