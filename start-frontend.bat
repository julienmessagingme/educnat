@echo off
echo ========================================
echo   PRD Automation - Frontend Dev
echo ========================================
echo.

cd /d "%~dp0\client"

echo Demarrage du frontend...
echo.
npm run dev

pause
