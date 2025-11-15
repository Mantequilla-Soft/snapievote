#!/bin/bash

echo "🐦 Starting SnapieVote Development Environment"
echo ""

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚙️  Creating backend .env file..."
    cp backend/.env.example backend/.env
    JWT_SECRET=$(openssl rand -hex 32)
    echo "JWT_SECRET=$JWT_SECRET" >> backend/.env
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting services..."
echo "   - Backend API: http://localhost:5000"
echo "   - Frontend UI: http://localhost:3000"
echo ""

# Start backend in background
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
cd ..
cd frontend && npm start

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
