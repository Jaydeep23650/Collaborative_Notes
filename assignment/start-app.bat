@echo off
echo Starting Collaborative Notes Application...
echo.

echo Step 1: Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MongoDB is running
) else (
    echo ❌ MongoDB is not running
    echo Please start MongoDB first by running: setup-mongodb.bat
    echo Or start it manually with: mongod --dbpath "C:\data\db"
    pause
    exit /b 1
)

echo.
echo Step 2: Starting Backend Server...
cd backend
start "Backend Server" cmd /k "echo Starting backend server... && npm run dev"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Step 3: Testing Backend...
cd ..
node test-server.js

echo.
echo Step 4: Starting Frontend...
cd note_app
start "Frontend App" cmd /k "echo Starting frontend... && npm run dev"

echo.
echo 🎉 Application started successfully!
echo.
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173
echo Health Check: http://localhost:5001/api/health
echo.
echo Press any key to exit...
pause > nul
