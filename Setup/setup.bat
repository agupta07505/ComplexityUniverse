@echo off
title ComplexityUniverse - Setup
cd /d "%~dp0\.."

echo ==========================================
echo   ComplexityUniverse - Aiven MySQL Setup
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Install it from https://nodejs.org ^(LTS version^), then run this file again.
  pause
  exit /b 1
)

echo [1/3] Installing project dependencies...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo [ERROR] npm install failed. Check your internet connection and try again.
  pause
  exit /b 1
)

echo.
echo [2/3] Setting up Aiven MySQL database, tables, views and triggers...
node scripts\setup-db.mjs
if errorlevel 1 (
  echo.
  echo [ERROR] Aiven MySQL setup failed. Check your .env.local credentials.
  pause
  exit /b 1
)

echo.
echo [3/3] Setup complete!
echo.
echo ==========================================
echo   Start the website with:  run.bat
echo ==========================================
pause
