@echo off
title ComplexityUniverse - Server
cd /d "%~dp0\.."

echo Starting ComplexityUniverse...
echo Connected to Aiven MySQL cloud database
echo.
echo Open http://localhost:3000 in your browser
echo Press Ctrl+C to stop the server.
echo.

call npm run dev
pause
