# 🆘 Installation Troubleshooting Guide

## Common Issues & Solutions

This guide covers every error a newbie might encounter during installation.

---

## Before You Start

### Prerequisites Check:
- ✅ Fresh Ubuntu 20.04+ or Debian VPS
- ✅ At least 2GB RAM
- ✅ 10GB free disk space
- ✅ Root or sudo access
- ✅ Internet connection

---

## Installation Errors

### ❌ "Permission denied" when running `./install.sh`

**Problem:** Script isn't executable

**Solution:**
```bash
chmod +x install.sh
./install.sh
```

---

### ❌ "Please don't run as root"

**Problem:** You're logged in as root user

**Solution:**
```bash
# Create a regular user if you don't have one
adduser myuser
usermod -aG sudo myuser

# Switch to that user
su - myuser

# Then run install
cd SnapieVote
./install.sh
```

---

### ❌ "Not in SnapieVote directory"

**Problem:** You're in the wrong folder

**Solution:**
```bash
# Find where you cloned it
find ~ -name "docker-compose.yml" -type f

# Or clone it first
git clone https://github.com/yourusername/SnapieVote.git
cd SnapieVote
./install.sh
```

---

### ❌ "Failed to download Docker installer"

**Problem:** Network issues or firewalled VPS

**Solution:**
```bash
# Try manual Docker installation
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Log out and back in, then run install.sh again
```

---

### ❌ "You're not in the docker group. Please log out..."

**Problem:** Need to refresh permissions

**Solution:**
```bash
# Log out completely
exit

# SSH back in
ssh user@your-vps-ip

# Run install again
cd SnapieVote
./install.sh
```

---

### ❌ "Docker build failed! Out of disk space"

**Problem:** Not enough space on VPS

**Solution:**
```bash
# Check disk space
df -h

# Clean up if needed
docker system prune -a
sudo apt-get clean
sudo apt-get autoremove

# Try again
./install.sh
```

---

### ❌ "Port 3000 is already in use"

**Problem:** Another app is using default ports

**Solution:**
The script should auto-detect and use alternative ports. If it fails:

```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :5000

# Manually set ports in .env
nano .env
```

Add:
```bash
BACKEND_PORT=5050
FRONTEND_PORT=8080
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

---

### ❌ "Cannot connect to the Docker daemon"

**Problem:** Docker service isn't running

**Solution:**
```bash
# Start Docker
sudo systemctl start docker

# Enable on boot
sudo systemctl enable docker

# Check status
sudo systemctl status docker

# Try install again
./install.sh
```

---

### ❌ Containers keep restarting (exit code 1)

**Problem:** Container crash on startup

**Solution:**
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Common fixes:
# 1. Missing .env files
ls -la backend/.env
ls -la frontend/.env

# 2. Invalid JWT secret
cat backend/.env | grep JWT_SECRET

# 3. Rebuild containers
docker-compose down
docker-compose up --build -d
```

---

## Access Issues

### ❌ Can't access http://your-ip:3000

**Problem:** Firewall blocking ports

**Solution:**
```bash
# Open ports in firewall
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp

# Or if using iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
sudo iptables-save

# Check if containers are running
docker-compose ps

# Check which ports are actually mapped
docker-compose ps | grep -E "PORTS|frontend|backend"
```

---

### ❌ Frontend loads but shows connection error

**Problem:** Backend not reachable

**Solution:**
```bash
# Check backend is running
docker-compose logs backend

# Test backend directly
curl http://localhost:5000/api/auth/check-setup

# Should return JSON like: {"setupRequired":true}

# If not working, restart
docker-compose restart backend
```

---

### ❌ "Failed to fetch" when trying to login

**Problem:** API URL misconfiguration

**Solution:**
```bash
# Check frontend can reach backend
docker-compose exec frontend ping backend

# Check frontend env
cat frontend/.env

# Should have:
# REACT_APP_API_URL=/api

# Restart frontend
docker-compose restart frontend
```

---

## After Installation Issues

### ❌ "Master password setup failed"

**Problem:** Database not writable

**Solution:**
```bash
# Check data directory permissions
ls -la backend/data/

# Fix permissions
sudo chown -R $USER:$USER backend/data/
chmod 755 backend/data/

# Restart backend
docker-compose restart backend
```

---

### ❌ Bot won't start (stays red/stopped)

**Problem:** Various possible causes

**Solution:**
```bash
# Check logs for clues
docker-compose logs backend | tail -50

# Common issues:
# 1. No accounts added - Add account first
# 2. No lists configured - Add users to lists
# 3. Master password wrong - Re-enter carefully
# 4. Database locked - Restart backend

# Nuclear option: fresh start
docker-compose down
rm backend/data/snapievote.db
docker-compose up -d
# Then setup again
```

---

### ❌ Bot detecting posts but not voting

**Problem:** Configuration issues

**Checklist:**
```bash
# 1. Check VP threshold
# Dashboard → Accounts → Make sure min_vp_threshold is reasonable (like 50-70%)

# 2. Check list item is active (not paused)
# Dashboard → Lists → Should show green "Active" button

# 3. Check daily limits not reached
# Dashboard → History → Count votes for that author today

# 4. Check account is active
# Dashboard → Accounts → Should show green "Active" button

# 5. Check logs
docker-compose logs backend | grep -i "detected\|scheduled\|executing"
```

---

### ❌ Votes failing: "Invalid signature"

**Problem:** Wrong posting key

**Solution:**
```bash
# The posting key might be wrong
# 1. Go to Accounts tab
# 2. Delete the account
# 3. Re-add with correct posting key
# 4. Get posting key from wallet.hive.blog → Permissions → Show Private Keys
```

---

### ❌ After VPS reboot, bot won't start

**Problem:** This is NORMAL (security feature)

**Solution:**
```bash
# 1. Check containers are running
docker-compose ps

# Should show "Up"

# 2. Open browser: http://your-vps-ip:3000
# 3. Login with master password
# 4. Click START button

# Bot intentionally requires manual start after reboot for security
```

---

## Emergency Commands

### Nuclear Reset (Fresh Start)
```bash
cd SnapieVote

# Stop everything
docker-compose down

# Delete database (LOSES ALL DATA!)
rm backend/data/snapievote.db
rm backend/lastblock.txt

# Delete env files
rm .env
rm backend/.env
rm frontend/.env

# Re-run installation
./install.sh
```

---

### Check Everything Status
```bash
# Containers running?
docker-compose ps

# Logs show errors?
docker-compose logs backend | tail -50
docker-compose logs frontend | tail -50

# Ports accessible?
curl http://localhost:5000/api/auth/check-setup
curl http://localhost:3000

# Disk space?
df -h

# Docker status?
sudo systemctl status docker

# Auto-start enabled?
sudo systemctl status snapievote
```

---

### Get Help

**If you're still stuck:**

1. **Check logs:**
   ```bash
   docker-compose logs backend > backend-logs.txt
   docker-compose logs frontend > frontend-logs.txt
   ```

2. **Share error details:**
   - Exact error message
   - Output from `docker-compose ps`
   - Contents of backend-logs.txt
   - VPS OS version: `cat /etc/os-release`

3. **Common info needed:**
   - RAM: `free -h`
   - Disk: `df -h`
   - Docker: `docker --version`
   - Ports: `sudo netstat -tulpn | grep LISTEN`

---

## Prevention Tips

✅ **Before running `./install.sh`:**
- Update system: `sudo apt-get update && sudo apt-get upgrade -y`
- Check disk space: `df -h` (need 10GB+ free)
- Check RAM: `free -h` (need 2GB+)
- Reboot if kernel updated: `sudo reboot`

✅ **Regular maintenance:**
```bash
# Weekly: Clean Docker cache
docker system prune -f

# Monthly: Check logs aren't too big
ls -lh backend/data/
```

---

**Built with ❤️ by MenO for the Hive Blockchain** 🐝
