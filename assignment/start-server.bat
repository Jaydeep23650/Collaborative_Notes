@echo off
echo Starting Collaborative Notes Server...
echo.

echo Checking if MongoDB is running...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MongoDB is running
) else (
    echo ❌ MongoDB is not running. Please start MongoDB first.
    echo You can start MongoDB with: mongod --dbpath "C:\data\db"
    echo Or install MongoDB as a service.
    pause
    exit /b 1
)

echo.
echo Starting backend server...
cd backend
start "Backend Server" cmd /k "echo Starting server... && npm run dev"

echo.
echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo.
echo Testing server endpoints...
cd ..
node test-server.js

echo.
echo Server should be running on: http://localhost:5001
echo Health check: http://localhost:5001/api/health
echo.
echo Press any key to exit...
pause > nul
