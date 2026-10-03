@echo off
title ComplexityUniverse - Server
cd /d %~dp0

echo Starting ComplexityUniverse...
echo ^(Local MySQL: make sure it is running - XAMPP: Start next to MySQL^)
echo ^(Aiven: nothing to do - the site connects to the cloud automatically^)
echo.
echo Open http://localhost:3000 in your browser
echo Press Ctrl+C to stop the server.
echo.

call npm run dev
pause
