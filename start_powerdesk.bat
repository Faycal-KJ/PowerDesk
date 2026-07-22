@echo off
cd /d "%~dp0"
echo Building PowerDesk...
call npx vite build >nul 2>&1
echo Starting PowerDesk...
start "" npx electron .
echo Done. PowerDesk window should open.
timeout /t 2 >nul
