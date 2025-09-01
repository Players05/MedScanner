#!/bin/bash

echo "🏥 Starting MedScanner Full Stack Application..."
echo

echo "📦 Installing dependencies..."
npm run install-all
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo
echo "🔨 Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build frontend"
    exit 1
fi

echo
echo "🚀 Starting application..."
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔌 API endpoints at: http://localhost:3000/api"
echo
echo "Press Ctrl+C to stop the server"
echo

npm start
