#!/bin/bash

echo "🔧 SnapieVote - Port Conflict Fixer"
echo "===================================="
echo ""

# Function to check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$1 "; then
        return 1
    else
        return 0
    fi
}

# Function to show what's using a port
show_port_usage() {
    local port=$1
    echo "Port $port is being used by:"
    lsof -i :$port 2>/dev/null || netstat -tulpn 2>/dev/null | grep ":$port "
}

echo "Checking default ports..."
echo ""

# Check port 3000
if ! check_port 3000; then
    echo "❌ Port 3000 (default frontend) is in use:"
    show_port_usage 3000
    echo ""
else
    echo "✅ Port 3000 is available"
fi

# Check port 5000
if ! check_port 5000; then
    echo "❌ Port 5000 (default backend) is in use:"
    show_port_usage 5000
    echo ""
else
    echo "✅ Port 5000 is available"
fi

# Detect docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE=""
fi

# Check for existing Docker containers
if [ -n "$DOCKER_COMPOSE" ]; then
    echo ""
    echo "Checking for existing SnapieVote containers..."
    if $DOCKER_COMPOSE ps 2>/dev/null | grep -q "snapievote"; then
        echo "⚠️  Found existing containers:"
        $DOCKER_COMPOSE ps
        echo ""
        read -p "Stop these containers? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $DOCKER_COMPOSE down
            echo "✅ Containers stopped"
        fi
    fi
fi

echo ""
echo "💡 Solutions:"
echo ""
echo "Option 1: Stop the processes using ports 3000/5000"
echo "  sudo lsof -ti:3000 | xargs kill -9"
echo "  sudo lsof -ti:5000 | xargs kill -9"
echo ""
echo "Option 2: Let the start script find alternative ports (recommended)"
echo "  ./start-docker.sh"
echo ""
echo "Option 3: Manually set ports in .env file"
echo "  echo 'FRONTEND_PORT=8080' > .env"
echo "  echo 'BACKEND_PORT=5050' >> .env"
if [ -n "$DOCKER_COMPOSE" ]; then
    echo "  $DOCKER_COMPOSE up -d"
else
    echo "  docker-compose up -d  # or 'docker compose up -d'"
fi
