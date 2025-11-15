#!/bin/bash

echo "🐦 SnapieVote - Docker Deployment Script"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sudo sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install it."
    exit 1
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚙️  Creating .env file..."
    cp backend/.env.example backend/.env
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s/your_jwt_secret_here_change_this/$JWT_SECRET/g" backend/.env
    echo "✅ Created backend/.env with random JWT_SECRET"
else
    echo "✅ backend/.env already exists"
fi

echo ""
echo "🚀 Building and starting Docker containers..."
docker compose up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check if containers are running
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "✅ SnapieVote is running!"
    echo ""
    echo "📍 Access points:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs:    docker compose logs -f"
    echo "   Stop app:     docker compose down"
    echo "   Restart app:  docker compose restart"
    echo "   View status:  docker compose ps"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Open http://localhost:3000 in your browser"
    echo "   2. Create your master password"
    echo "   3. Add your Hive accounts"
    echo "   4. Setup your voting lists"
    echo "   5. Hit START!"
    echo ""
else
    echo ""
    echo "❌ Something went wrong. Check logs with:"
    echo "   docker compose logs"
fi
