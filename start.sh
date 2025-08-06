#!/bin/bash

# Syntax Dropshipping Platform - Development Startup Script

echo "🚀 Starting Syntax Dropshipping Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js version 14 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing server dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client
    npm install
    cd ..
fi

echo "✅ Dependencies installed"

# Create data directory if it doesn't exist
if [ ! -d "server/data" ]; then
    echo "📁 Creating data directory..."
    mkdir -p server/data
fi

# Create uploads directory if it doesn't exist  
if [ ! -d "server/uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p server/uploads
fi

echo "✅ Directories created"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating default configuration..."
    cat > .env << EOF
PORT=5000
NODE_ENV=development
JWT_SECRET=syntax_dropshipping_secret_key_2024
EOF
    echo "✅ Default .env file created"
fi

# Check if client .env file exists
if [ ! -f "client/.env" ]; then
    echo "⚠️  No client .env file found. Creating default configuration..."
    cat > client/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
EOF
    echo "✅ Default client .env file created"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To start frontend only:"
echo "  cd client && npm start"
echo ""
echo "To start backend only:"
echo "  npm run server"
echo ""
echo "Application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
echo "Happy coding! 🚀"