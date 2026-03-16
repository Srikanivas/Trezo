@echo off
echo 🚀 Setting up Trezo Backend...

REM Create .env file from template
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created. Please update it with your configuration.
) else (
    echo ⚠️  .env file already exists.
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create logs directory
if not exist logs mkdir logs

REM Build the project
echo 🔨 Building TypeScript...
npm run build

echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Update .env file with your Algorand network configuration
echo 2. Start development server: npm run dev
echo 3. Or start production server: npm start
echo.
echo 🌐 API will be available at: http://localhost:3001
echo 📚 API Documentation: http://localhost:3001/api/v1

pause
