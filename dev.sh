#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for flags
START_NOW=false
START_BLOCK=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --now)
            START_NOW=true
            echo -e "${YELLOW}⚡ --now flag detected: Will start from current block${NC}"
            shift
            ;;
        --block)
            START_BLOCK="$2"
            echo -e "${YELLOW}🔢 --block flag detected: Will start from block $START_BLOCK${NC}"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: ./dev.sh [--now] [--block BLOCK_NUMBER]"
            exit 1
            ;;
    esac
done

if [ "$START_NOW" = true ] && [ -n "$START_BLOCK" ]; then
    echo -e "${RED}Error: Cannot use --now and --block together${NC}"
    exit 1
fi

echo ""

echo -e "${BLUE}🐦 Starting SnapieVote Development Environment${NC}"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    (cd backend && npm install)
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    (cd frontend && npm install)
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${BLUE}⚙️  Creating backend .env file...${NC}"
    cp backend/.env.example backend/.env
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" backend/.env
fi

# Load port configuration
BACKEND_PORT=5000
FRONTEND_PORT=3000
if [ -f ".env" ]; then
    source .env
fi

# Create data directory if it doesn't exist
mkdir -p backend/data

# Handle --now flag: delete lastblock.txt to start fresh
if [ "$START_NOW" = true ]; then
    if [ -f "backend/lastblock.txt" ]; then
        rm backend/lastblock.txt
        echo -e "${YELLOW}🗑️  Deleted lastblock.txt - bot will start from current block${NC}"
    else
        echo -e "${YELLOW}ℹ️  No lastblock.txt found - bot will start from current block anyway${NC}"
    fi
fi

# Handle --block flag: set specific starting block
if [ -n "$START_BLOCK" ]; then
    echo "$START_BLOCK" > backend/lastblock.txt
    echo -e "${YELLOW}📝 Set starting block to $START_BLOCK in lastblock.txt${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}🚀 Starting services...${NC}"
echo -e "   - Backend API: ${GREEN}http://localhost:${BACKEND_PORT}${NC}"
echo -e "   - Frontend UI: ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
echo ""
echo -e "${BLUE}💡 Press Ctrl+C to stop both services${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${BLUE}🛑 Stopping services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start backend
(cd backend && PORT=$BACKEND_PORT npm run dev) &
BACKEND_PID=$!

# Wait for backend to start
sleep 4

# Start frontend
(cd frontend && PORT=$FRONTEND_PORT BROWSER=none npm start) &
FRONTEND_PID=$!

echo -e "${GREEN}✅ Both services started!${NC}"
echo -e "${BLUE}📍 Open your browser at: http://localhost:${FRONTEND_PORT}${NC}"
echo ""

# Wait for both processes
wait
