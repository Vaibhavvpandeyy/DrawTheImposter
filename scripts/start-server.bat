@echo off
cd /d "%~dp0\.."
if not exist node_modules\socket.io (
  echo Installing server dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)
echo.
echo Starting Draw the Imposter LAN server. Use the Wi-Fi IPv4 address printed below.
call npm run server
