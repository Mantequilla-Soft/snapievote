# 🐳 Docker Port Configuration Guide

## Understanding Docker Ports

Docker uses **port mapping**: `EXTERNAL:INTERNAL`

- **EXTERNAL** = Port on your VPS that users access
- **INTERNAL** = Port inside the Docker container (don't change)

Example: `"8080:3000"` means:
- Container runs on port 3000 (internal)
- Users access via port 8080 (external on your VPS)

## Quick Setup for VPS

### Step 1: Check Available Ports

On your VPS, see what ports are in use:

```bash
# Check what's using common ports
sudo lsof -i :3000
sudo lsof -i :5000
sudo lsof -i :8080
sudo netstat -tulpn | grep LISTEN
```

### Step 2: Choose Your Ports

Pick two available ports for your VPS:
- One for **frontend** (web interface)
- One for **backend** (API)

Common choices:
- Frontend: 3000, 3001, 8000, 8080, 8888
- Backend: 5000, 5001, 5050, 9000

### Step 3: Configure SnapieVote

Create `.env` in project root:

```bash
cd SnapieVote
nano .env
```

Add your chosen ports:

```bash
# Example: Using 8080 for frontend, 5050 for backend
BACKEND_PORT=5050
FRONTEND_PORT=8080
```

### Step 4: Update Backend Config

Also configure backend:

```bash
cd backend
cp .env.example .env
nano .env
```

Make sure JWT_SECRET is set:

```bash
PORT=5000              # Internal port (don't change)
JWT_SECRET=your-super-secret-random-string-here
NODE_ENV=production
FRONTEND_PORT=8080     # Must match your root .env FRONTEND_PORT
```

### Step 5: Start Docker

```bash
cd ..  # Back to project root
docker-compose up -d
```

### Step 6: Access Your App

Your app is now available at:
- **Frontend**: `http://your-vps-ip:8080` (or your FRONTEND_PORT)
- **Backend API**: `http://your-vps-ip:5050` (or your BACKEND_PORT)

## Real-World Example

Let's say your VPS already has:
- Port 3000: Another Node app
- Port 5000: Another API
- Port 8080: Nginx

**Choose different ports:**

```bash
# .env in project root
BACKEND_PORT=5050
FRONTEND_PORT=3001
```

Then access:
- Frontend: `http://123.45.67.89:3001`
- Backend: `http://123.45.67.89:5050`

## Docker Compose Explained

Your `docker-compose.yml` has this magic:

```yaml
ports:
  - "${BACKEND_PORT:-5000}:5000"
  - "${FRONTEND_PORT:-3000}:80"
```

Translation:
- `${BACKEND_PORT:-5000}` = Use BACKEND_PORT from .env, default to 5000
- `:5000` = Internal container port (fixed, don't change)
- `${FRONTEND_PORT:-3000}` = Use FRONTEND_PORT from .env, default to 3000
- `:80` = Internal Nginx port (fixed, don't change)

## Checking Your Setup

After starting Docker:

```bash
# Verify containers are running
docker-compose ps

# Check which ports are mapped
docker-compose ps | grep -E "PORTS|frontend|backend"

# Example output:
# backend    ... 0.0.0.0:5050->5000/tcp
# frontend   ... 0.0.0.0:8080->80/tcp
```

This shows:
- Backend: External 5050 → Internal 5000
- Frontend: External 8080 → Internal 80

## Troubleshooting

### Error: "port is already allocated"

Someone else is using that port! Choose a different one:

```bash
# Find what's using the port
sudo lsof -i :8080

# Edit .env and change to available port
nano .env
```

### Frontend can't reach backend

The frontend needs to know the backend URL. Update:

```bash
# In docker-compose.yml, add environment to frontend:
frontend:
  environment:
    - REACT_APP_API_URL=http://your-vps-ip:5050/api
```

Or use a reverse proxy (see next section).

## 🚀 Pro Setup: Using Reverse Proxy (Recommended)

Instead of exposing both ports, use one port (80/443) with Nginx:

```nginx
# /etc/nginx/sites-available/snapievote
server {
    listen 80;
    server_name https://snapievote.yourdomain.com;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
    }
}
```

Then users just go to: `https://snapievote.yourdomain.com`

No ports needed! And you can add SSL with certbot.

## Summary

1. **Check** what ports are available on your VPS
2. **Create** `.env` in project root with your ports
3. **Configure** backend/.env with JWT_SECRET
4. **Run** `docker-compose up -d`
5. **Access** at `http://your-vps-ip:YOUR_FRONTEND_PORT`

That's it! The internal Docker ports never change, only the external ones. 🎉

---

**Built with ❤️ by MenO for the Hive Blockchain** 🐝
