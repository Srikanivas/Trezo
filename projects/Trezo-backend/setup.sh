#!/bin/bash

echo "🚀 Setting up Trezo Backend..."

# Create .env file from template
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
else
    echo "⚠️  .env file already exists."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Build the project
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your Algorand network configuration"
echo "2. Start development server: npm run dev"
echo "3. Or start production server: npm start"
echo ""
echo "🌐 API will be available at: http://localhost:3001"
echo "📚 API Documentation: http://localhost:3001/api/v1"
