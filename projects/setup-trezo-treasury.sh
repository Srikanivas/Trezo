#!/bin/bash

echo "🚀 Setting up Trezo Treasury Wallet System..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_success "npm $(npm -v) is installed"

# Setup Backend
print_status "Setting up backend..."
cd Trezo-backend

if [ ! -f "package.json" ]; then
    print_error "Backend package.json not found. Please ensure you're in the correct directory."
    exit 1
fi

print_status "Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

print_status "Building backend..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Backend built successfully"
else
    print_error "Backend build failed"
    exit 1
fi

# Setup Frontend
print_status "Setting up frontend..."
cd ../Trezo-frontend

if [ ! -f "package.json" ]; then
    print_error "Frontend package.json not found. Please ensure you're in the correct directory."
    exit 1
fi

print_status "Installing frontend dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Go back to root
cd ..

print_success "Setup completed successfully!"
echo ""
echo "=============================================="
echo "🎉 Trezo Treasury System Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Set up PostgreSQL database"
echo "2. Configure AWS KMS key"
echo "3. Update environment variables in .env files"
echo "4. Initialize database: cd Trezo-backend && npm run init-db"
echo "5. Start backend: cd Trezo-backend && npm run dev"
echo "6. Start frontend: cd Trezo-frontend && npm run dev"
echo ""
echo "📚 Documentation: See README.md for detailed setup instructions"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🔐 Security Features:"
echo "   ✅ AWS KMS encryption for private keys"
echo "   ✅ JWT authentication"
echo "   ✅ Comprehensive audit logging"
echo "   ✅ Algorand TestNet integration"
echo ""
print_warning "Remember to configure your environment variables before starting!"
