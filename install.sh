#!/bin/bash

# ========================================
# SnapieVote - Automated VPS Installation
# Built with ❤️ by MenO for Hive Blockchain
# ========================================

# Exit on any error, but handle gracefully
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}========================================${NC}"
echo -e "${BOLD}${BLUE}🐝 SnapieVote VPS Installation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}This script will:${NC}"
echo -e "  ✓ Install Docker & Docker Compose (if needed)"
echo -e "  ✓ Find available ports automatically"
echo -e "  ✓ Generate secure secrets"
echo -e "  ✓ Build and start your bot"
echo -e "  ✓ Set up auto-start on reboot"
echo ""
echo -e "${YELLOW}Estimated time: 5-10 minutes${NC}"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ ERROR: Please don't run as root!${NC}"
   echo -e "${YELLOW}Run as your normal user: ${NC}./install.sh"
   exit 1
fi

# Check if git repo
if [ ! -f "docker-compose.yml" ]; then
   echo -e "${RED}❌ ERROR: Not in SnapieVote directory!${NC}"
   echo -e "${YELLOW}Please cd into the SnapieVote folder first.${NC}"
   exit 1
fi

# Function to check if port is available
check_port() {
    local port=$1
    if sudo lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 1  # Port in use
    else
        return 0  # Port available
    fi
}

# Function to find available port
find_available_port() {
    local start_port=$1
    local max_attempts=100
    
    for ((i=0; i<max_attempts; i++)); do
        local port=$((start_port + i))
        if check_port $port; then
            echo $port
            return 0
        fi
    done
    
    return 1
}

echo -e "${BLUE}📋 Step 1: Checking system requirements...${NC}"
echo ""

# Check if user is in docker group
if ! groups | grep -q docker && command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  You're not in the docker group. Adding you...${NC}"
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}⚠️  Please log out and back in, then run this script again.${NC}"
    exit 0
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found. Installing Docker...${NC}"
    echo -e "${BLUE}   This may take a few minutes...${NC}"
    
    # Download and install Docker
    if curl -fsSL https://get.docker.com -o get-docker.sh; then
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        echo -e "${GREEN}✅ Docker installed successfully!${NC}"
        echo ""
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANT: Log out and log back in now!${NC}"
        echo -e "${YELLOW}   Then run: ./install.sh${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        exit 0
    else
        echo -e "${RED}❌ Failed to download Docker installer${NC}"
        echo -e "${YELLOW}Please install Docker manually: https://docs.docker.com/engine/install/${NC}"
        exit 1
    fi
else
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker is installed: ${DOCKER_VERSION}${NC}"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose not found. Installing...${NC}"
    
    if sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose; then
        sudo chmod +x /usr/local/bin/docker-compose
        echo -e "${GREEN}✅ Docker Compose installed${NC}"
    else
        echo -e "${RED}❌ Failed to install Docker Compose${NC}"
        echo -e "${YELLOW}Please install manually: https://docs.docker.com/compose/install/${NC}"
        exit 1
    fi
else
    COMPOSE_VERSION=$(docker-compose --version 2>/dev/null || docker compose version)
    echo -e "${GREEN}✅ Docker Compose is installed: ${COMPOSE_VERSION}${NC}"
fi

# Test Docker permissions
if ! docker ps >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Can't run Docker commands. Checking permissions...${NC}"
    echo -e "${YELLOW}   You may need to log out and back in.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Step 2: Scanning for available ports...${NC}"
echo ""

# Check default ports
BACKEND_PORT=5000
FRONTEND_PORT=3000

echo -e "Checking port 5000 (Backend)..."
if ! check_port 5000; then
    echo -e "${YELLOW}⚠️  Port 5000 is in use. Finding alternative...${NC}"
    BACKEND_PORT=$(find_available_port 5001)
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Could not find available port for backend${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Using port $BACKEND_PORT for backend${NC}"
else
    echo -e "${GREEN}✅ Port 5000 is available${NC}"
fi

echo -e "Checking port 3000 (Frontend)..."
if ! check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is in use. Finding alternative...${NC}"
    FRONTEND_PORT=$(find_available_port 3001)
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Could not find available port for frontend${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Using port $FRONTEND_PORT for frontend${NC}"
else
    echo -e "${GREEN}✅ Port 3000 is available${NC}"
fi

echo ""
echo -e "${BLUE}⚙️  Step 3: Configuring environment...${NC}"
echo ""

# Create root .env for Docker ports
cat > .env << EOF
# SnapieVote Port Configuration
# Generated by install.sh

BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
EOF

echo -e "${GREEN}✅ Created .env with ports${NC}"

# Setup backend .env
if [ ! -f backend/.env ]; then
    echo -e "Setting up backend configuration..."
    cp backend/.env.example backend/.env
    
    # Generate secure JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Update backend .env
    cat > backend/.env << EOF
# Backend API port
PORT=5000

# JWT secret for authentication (auto-generated)
JWT_SECRET=$JWT_SECRET

# Environment
NODE_ENV=production

# Frontend port (for CORS)
FRONTEND_PORT=$FRONTEND_PORT
EOF
    
    echo -e "${GREEN}✅ Backend configured with secure JWT secret${NC}"
else
    echo -e "${GREEN}✅ Backend .env already exists${NC}"
fi

# Setup frontend .env
if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✅ Frontend configured${NC}"
else
    echo -e "${GREEN}✅ Frontend .env already exists${NC}"
fi

echo ""
echo -e "${BLUE}🏗️  Step 4: Building Docker containers...${NC}"
echo -e "${YELLOW}   This will take 5-10 minutes (downloads and compiles)${NC}"
echo -e "${YELLOW}   Grab a coffee! ☕${NC}"
echo ""

if ! docker-compose build; then
    echo -e "${RED}❌ Docker build failed!${NC}"
    echo -e "${YELLOW}Check errors above. Common issues:${NC}"
    echo -e "   - Out of disk space: df -h"
    echo -e "   - Network issues: check internet connection"
    echo -e "   - Docker daemon: sudo systemctl status docker"
    exit 1
fi

echo ""
echo -e "${BLUE}🚀 Step 5: Starting services...${NC}"
echo ""

if ! docker-compose up -d; then
    echo -e "${RED}❌ Failed to start containers!${NC}"
    echo -e "${YELLOW}Check logs: docker-compose logs${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}⏰ Step 6: Setting up auto-start on boot...${NC}"
echo ""

# Create systemd service
SERVICE_FILE="/etc/systemd/system/snapievote.service"
INSTALL_DIR=$(pwd)

sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=SnapieVote - Hive Blockchain Automation
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable snapievote.service

echo -e "${GREEN}✅ Auto-start on boot enabled${NC}"

echo ""
echo -e "${BLUE}✅ Step 7: Verifying installation...${NC}"
echo ""

sleep 5

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Containers are running!${NC}"
else
    echo -e "${RED}❌ Containers failed to start. Check logs:${NC}"
    echo -e "   docker-compose logs"
    exit 1
fi

# Get server IP (force IPv4)
SERVER_IP=$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -1)

# Warn if no IPv4 found
if [[ ! "$SERVER_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${YELLOW}⚠️  Could not detect IPv4 address${NC}"
    SERVER_IP="YOUR_VPS_IP"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}🎉 INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BOLD}${BLUE}📍 Access Your Bot:${NC}"
echo -e "${BOLD}${GREEN}   👉 http://$SERVER_IP:$FRONTEND_PORT${NC}"
echo ""
echo -e "${BOLD}${BLUE}🔐 Next Steps (in order):${NC}"
echo -e "${YELLOW}   1.${NC} Open the URL above in your browser"
echo -e "${YELLOW}   2.${NC} Create a master password (SAVE IT SOMEWHERE SAFE!)"
echo -e "${YELLOW}   3.${NC} Login with your password"
echo -e "${YELLOW}   4.${NC} Go to Accounts tab → Add your Hive account(s)"
echo -e "${YELLOW}   5.${NC} Go to Lists tab → Add users to Good or Shit list"
echo -e "${YELLOW}   6.${NC} Click the big green START button"
echo -e "${YELLOW}   7.${NC} Watch the logs to see it working!"
echo ""
echo -e "${BOLD}${BLUE}🔧 Useful Commands:${NC}"
echo -e "${BLUE}   View logs:${NC}       docker-compose logs -f"
echo -e "${BLUE}   Stop bot:${NC}        docker-compose down"
echo -e "${BLUE}   Start bot:${NC}       docker-compose up -d"
echo -e "${BLUE}   Restart:${NC}         docker-compose restart"
echo -e "${BLUE}   Check status:${NC}    docker-compose ps"
echo ""
echo -e "${BOLD}${BLUE}� Configuration Saved:${NC}"
echo -e "   .env                (ports: $BACKEND_PORT, $FRONTEND_PORT)"
echo -e "   backend/.env        (JWT secret: auto-generated)"
echo -e "   frontend/.env       (API config)"
echo ""
echo -e "${BOLD}${BLUE}🔄 Auto-Start Setup:${NC}"
echo -e "   ${GREEN}✓${NC} Bot will auto-start when VPS reboots"
echo -e "   ${YELLOW}⚠${NC}  You'll need to click START after reboot (security)"
echo -e "   Check status: ${BLUE}sudo systemctl status snapievote${NC}"
echo ""
echo -e "${BOLD}${BLUE}💡 Pro Tips:${NC}"
echo -e "   • Start with small vote weights (10-25%) to test"
echo -e "   • Set delays (5+ minutes) to look organic"
echo -e "   • Monitor VP levels in the dashboard"
echo -e "   • Check logs regularly for errors"
echo ""
echo -e "${BOLD}${BLUE}� Need Help?${NC}"
echo -e "   • Check logs: ${BLUE}docker-compose logs backend${NC}"
echo -e "   • Read docs: ${BLUE}docs/QUICKSTART.md${NC}"
echo -e "   • Port config: ${BLUE}docs/DOCKER_PORTS.md${NC}"
echo -e "   • Security: ${BLUE}docs/SECURITY.md${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Built with ❤️ by MenO for the Hive Blockchain 🐝${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
