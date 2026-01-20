#!/bin/bash

echo "🐦 SnapieVote - Docker Deployment Script"
echo "========================================"
echo ""

# Function to check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$1 "; then
        return 1
    else
        return 0
    fi
}

# Function to find an available port starting from a given port
find_available_port() {
    local port=$1
    while ! check_port $port; do
        port=$((port + 1))
    done
    echo $port
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sudo sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is available (try both old and new syntax)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Docker Compose is not available. Please install it:"
    echo "   sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "   sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi
echo "✅ Using: $DOCKER_COMPOSE"

# Find available ports
echo "🔍 Checking for available ports..."
FRONTEND_PORT=$(find_available_port 3000)
BACKEND_PORT=$(find_available_port 5000)

if [ "$FRONTEND_PORT" != "3000" ]; then
    echo "⚠️  Port 3000 in use, using port $FRONTEND_PORT for frontend"
fi
if [ "$BACKEND_PORT" != "5000" ]; then
    echo "⚠️  Port 5000 in use, using port $BACKEND_PORT for backend"
fi

# Write ports to .env file for docker-compose
echo "📝 Writing port configuration to .env file..."
cat > .env << EOF
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT
EOF
echo "✅ Ports configured: Frontend=$FRONTEND_PORT, Backend=$BACKEND_PORT"

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

# Check if containers are already running and stop them
echo ""
if $DOCKER_COMPOSE ps -q 2>/dev/null | grep -q .; then
    echo "⚠️  Existing containers detected, cleaning up..."
    $DOCKER_COMPOSE down 2>/dev/null
    sleep 2
fi

echo ""
echo "🚀 Building and starting Docker containers..."
echo "   Frontend will be on port: $FRONTEND_PORT"
echo "   Backend will be on port: $BACKEND_PORT"
$DOCKER_COMPOSE up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check if containers are running (give them a moment to start or fail)
sleep 3
if $DOCKER_COMPOSE ps | grep -q "Up"; then
    echo ""
    echo "✅ SnapieVote is running!"
    echo ""
    echo "📍 Access points:"
    echo "   Frontend: http://localhost:$FRONTEND_PORT"
    echo "   Backend:  http://localhost:$BACKEND_PORT"
    echo ""
    echo "📋 Useful command$DOCKER_COMPOSE logs -f"
    echo "   Stop app:     $DOCKER_COMPOSE down"
    echo "   Restart app:  $DOCKER_COMPOSE restart"
    echo "   View status:  $DOCKER_COMPOSE restart"
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
    echo "   $DOCKER_COMPOSE logs"
    echo ""
    echo "💡 Debugging:"
    echo "   Ports configured: Frontend=$FRONTEND_PORT, Backend=$BACKEND_PORT"
    echo ""
    echo "   Check what failed:"
    echo "   $DOCKER_COMPOSE ps -a"
    echo ""
    echo "   If port conflicts persist, free them manually:"
    echo "   $DOCKER_COMPOSE down"
    echo "   sudo lsof -ti:$FRONTEND_PORT | xargs kill -9  # Kill process on frontend port"
    echo "   sudo lsof -ti:$BACKEND_PORT | xargs kill -9   # Kill process on backend port"
fi
