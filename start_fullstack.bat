@echo off
echo 🏥 Starting MedScanner Full Stack Application...
echo.

echo 📦 Installing dependencies...
call npm run install-all
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔨 Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)

echo.
echo 🚀 Starting application...
echo 📱 Frontend will be available at: http://localhost:3000
echo 🔌 API endpoints at: http://localhost:3000/api
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start
pause
