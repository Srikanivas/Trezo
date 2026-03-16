@echo off
echo 🚀 Setting up Trezo Treasury Wallet System...
echo ==============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

echo [SUCCESS] Node.js is installed

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo [SUCCESS] npm is installed

REM Setup Backend
echo [INFO] Setting up backend...
cd Trezo-backend

if not exist "package.json" (
    echo [ERROR] Backend package.json not found. Please ensure you're in the correct directory.
    pause
    exit /b 1
)

echo [INFO] Installing backend dependencies...
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Backend dependencies installed

echo [INFO] Building backend...
call npm run build

if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed
    pause
    exit /b 1
)

echo [SUCCESS] Backend built successfully

REM Setup Frontend
echo [INFO] Setting up frontend...
cd ..\Trezo-frontend

if not exist "package.json" (
    echo [ERROR] Frontend package.json not found. Please ensure you're in the correct directory.
    pause
    exit /b 1
)

echo [INFO] Installing frontend dependencies...
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Frontend dependencies installed

REM Go back to root
cd ..

echo [SUCCESS] Setup completed successfully!
echo.
echo ==============================================
echo 🎉 Trezo Treasury System Setup Complete!
echo ==============================================
echo.
echo Next steps:
echo 1. Set up PostgreSQL database
echo 2. Configure AWS KMS key
echo 3. Update environment variables in .env files
echo 4. Initialize database: cd Trezo-backend ^&^& npm run init-db
echo 5. Start backend: cd Trezo-backend ^&^& npm run dev
echo 6. Start frontend: cd Trezo-frontend ^&^& npm run dev
echo.
echo 📚 Documentation: See README.md for detailed setup instructions
echo.
echo 🌐 URLs:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3001
echo.
echo 🔐 Security Features:
echo    ✅ AWS KMS encryption for private keys
echo    ✅ JWT authentication
echo    ✅ Comprehensive audit logging
echo    ✅ Algorand TestNet integration
echo.
echo [WARNING] Remember to configure your environment variables before starting!
pause
