@echo off
echo Setting up MongoDB for Collaborative Notes...
echo.

echo Checking if MongoDB is installed...
where mongod >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ MongoDB is not installed or not in PATH
    echo Please install MongoDB from: https://www.mongodb.com/try/download/community
    echo Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas
    pause
    exit /b 1
)

echo ✅ MongoDB is installed

echo.
echo Checking if MongoDB data directory exists...
if not exist "C:\data\db" (
    echo Creating MongoDB data directory...
    mkdir "C:\data\db" 2>nul
    if %ERRORLEVEL% neq 0 (
        echo ❌ Failed to create data directory. Please run as administrator.
        pause
        exit /b 1
    )
    echo ✅ Data directory created
) else (
    echo ✅ Data directory exists
)

echo.
echo Starting MongoDB...
echo Note: Keep this window open while using the application
echo.
mongod --dbpath "C:\data\db"
