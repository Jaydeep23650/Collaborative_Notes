@echo off
echo Starting Debug Mode for Collaborative Notes...
echo.

echo Checking if MongoDB is running...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MongoDB is running
) else (
    echo ❌ MongoDB is not running. Please start MongoDB first.
    echo You can start MongoDB with: mongod --dbpath "C:\data\db"
    pause
    exit /b 1
)

echo.
echo Starting backend server...
cd backend
start "Backend Debug" cmd /k "echo Backend starting... && npm run dev"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Testing backend health...
curl -s http://localhost:5001/api/health
if %errorlevel% neq 0 (
    echo ❌ Backend health check failed
) else (
    echo ✅ Backend is responding
)

echo.
echo Starting frontend...
cd ../note_app
start "Frontend Debug" cmd /k "echo Frontend starting... && npm run dev"

echo.
echo Debug environment started!
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173
echo Health Check: http://localhost:5001/api/health
echo Test Create: http://localhost:5001/api/test-create
echo.
echo Check the console windows for any error messages.
echo Press any key to exit...
pause > nul