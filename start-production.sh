#!/bin/bash

# Syntax Dropshipping Platform - Production Startup Script

echo "🚀 Starting Syntax Dropshipping Platform (Production Mode)..."

# Set production environment
export NODE_ENV=production
export PORT=5000

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

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "❌ server/.env file not found. Please create it with your database configuration."
    echo "Example:"
    echo "DB_HOST=localhost"
    echo "DB_USER=root" 
    echo "DB_PASSWORD="
    echo "DB_NAME=syntaxdropshipping"
    echo "DB_PORT=3306"
    exit 1
fi

# Load environment variables
source server/.env

# Test database connection
echo "🔄 Testing database connection..."
mysql -h${DB_HOST} -u${DB_USER} -p${DB_PASSWORD} -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Database connection failed. Please check your database configuration."
    exit 1
fi

echo "✅ Database connection successful"

# Build frontend for production
echo "📦 Building frontend..."
cd client
npm run build
cd ..

echo "✅ Frontend build completed"

# Start production server
echo "🌟 Starting production server on port ${PORT}..."
node server/server.js