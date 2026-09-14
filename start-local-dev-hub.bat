@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo [Local Dev Hub] Node.js and npm are required.
  pause
  exit /b 1
)

if not exist "node_modules\next\package.json" (
  echo [Local Dev Hub] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [Local Dev Hub] npm install failed.
    pause
    exit /b 1
  )
)

echo [Local Dev Hub] Starting at http://127.0.0.1:8790
call npm run dev
