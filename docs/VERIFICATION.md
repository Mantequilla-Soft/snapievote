# ✅ SnapieVote - Installation Verification

## Quick Verification Checklist

Run through this checklist to verify your SnapieVote installation is complete and ready to use.

### 📁 File Structure Check

```bash
# Run this command to verify all files exist:
ls -R
```

You should see:
- ✅ `.github/copilot-instructions.md`
- ✅ `backend/` directory with services, routes, middleware
- ✅ `frontend/` directory with src/components
- ✅ `docker-compose.yml`
- ✅ `README.md`
- ✅ `QUICKSTART.md`
- ✅ `PROJECT_SUMMARY.md`
- ✅ `start-dev.sh`
- ✅ `start-docker.sh`

### 📦 Dependencies Check

**Backend:**
```bash
cd backend
npm list --depth=0
```

Should show:
- ✅ `@hiveio/dhive`
- ✅ `express`
- ✅ `better-sqlite3`
- ✅ `jsonwebtoken`
- ✅ `bcryptjs`
- ✅ `cors`
- ✅ `dotenv`

**Frontend:**
```bash
cd frontend
npm list --depth=0
```

Should show:
- ✅ `react`
- ✅ `react-dom`
- ✅ `react-router-dom`
- ✅ `axios`
- ✅ `react-scripts`

### 🔧 Configuration Check

**Backend .env file:**
```bash
cat backend/.env
```

Should contain:
- ✅ `PORT=5000`
- ✅ `JWT_SECRET=` (some long string)
- ✅ `NODE_ENV=development`

If not, run:
```bash
cd backend
cp .env.example .env
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
```

### 🚀 Backend Startup Test

```bash
cd backend
node server.js
```

Expected output:
```
🚀 SnapieVote Backend running on port 5000
Environment: development
```

Press `Ctrl+C` to stop.

If you see errors:
- **"directory does not exist"** → Run `mkdir -p backend/data`
- **"PORT in use"** → Change PORT in .env
- **"Cannot find module"** → Run `npm install`

### 🎨 Frontend Startup Test

```bash
cd frontend
npm start
```

Should:
- ✅ Compile without errors
- ✅ Open browser at http://localhost:3000
- ✅ Show SnapieVote login/setup screen

Press `Ctrl+C` to stop.

If you see errors:
- **Port 3000 in use** → It will offer 3001, accept it
- **Module errors** → Run `npm install`
- **Blank page** → Check browser console (F12)

### 🐳 Docker Test

```bash
docker --version
docker compose version
```

Should show versions installed.

Test build (optional):
```bash
docker compose build
```

Should complete without errors.

### 🔗 API Connectivity Test

With backend running:

```bash
# Health check
curl http://localhost:5000/api/health

# Expected: {"status":"ok","message":"SnapieVote API is running"}

# Setup check
curl http://localhost:5000/api/auth/check-setup

# Expected: {"setupRequired":true}
```

### ✅ Full System Test

1. **Start development mode:**
   ```bash
   ./start-dev.sh
   ```

2. **Open browser:** http://localhost:3000

3. **Complete setup:**
   - Create master password
   - Login
   - Verify dashboard loads

4. **Test features:**
   - Go to Accounts → Try adding account (use fake data for test)
   - Go to Lists → Try adding username to list
   - Check all UI elements render correctly

5. **Stop servers:** `Ctrl+C` in terminal

### 🐳 Docker Test

1. **Start Docker:**
   ```bash
   ./start-docker.sh
   ```

2. **Check containers:**
   ```bash
   docker compose ps
   ```
   
   Should show both `backend` and `frontend` as "Up"

3. **Check logs:**
   ```bash
   docker compose logs backend
   docker compose logs frontend
   ```

4. **Access app:** http://localhost:3000

5. **Stop Docker:**
   ```bash
   docker compose down
   ```

## 🎯 Production Deployment Verification

For VPS deployment:

### Pre-deployment
- [ ] Docker installed on VPS
- [ ] Domain/subdomain DNS configured
- [ ] Ports 3000 and 5000 open (or behind reverse proxy)
- [ ] .env file configured with strong JWT_SECRET

### Post-deployment
- [ ] Containers running: `docker compose ps`
- [ ] No errors in logs: `docker compose logs`
- [ ] Can access frontend via domain
- [ ] Can complete setup and login
- [ ] SSL configured (if using HTTPS)

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@hiveio/dhive'"
**Solution:**
```bash
cd backend
npm install
```

### Issue: "EADDRINUSE: address already in use"
**Solution:**
```bash
# Find process using port
sudo lsof -i :5000
# Kill it or change PORT in .env
```

### Issue: "Database error"
**Solution:**
```bash
# Create data directory
mkdir -p backend/data
# Delete old database if corrupted
rm backend/data/snapievote.db
```

### Issue: Frontend blank page
**Solution:**
- Check browser console (F12)
- Verify backend is running
- Check CORS settings
- Clear browser cache

### Issue: "JWT malformed"
**Solution:**
- Logout and login again
- Clear localStorage
- Check JWT_SECRET is set

### Issue: Docker build fails
**Solution:**
```bash
# Clean rebuild
docker compose down -v
docker system prune -a
docker compose up --build -d
```

### Issue: Bot not voting
**Solution:**
- Check accounts are active
- Verify VP is above threshold
- Ensure users are in lists
- Check bot is started (green indicator)
- Review backend logs for errors

## 📋 Health Check Commands

```bash
# Backend health
curl http://localhost:5000/api/health

# Check Docker containers
docker compose ps

# Backend logs
docker compose logs backend --tail=50

# Frontend logs
docker compose logs frontend --tail=50

# Database check
sqlite3 backend/data/snapievote.db "SELECT COUNT(*) FROM accounts;"

# Last block processed
cat backend/data/lastblock.txt
```

## ✅ You're Ready When...

- ✅ All dependencies installed
- ✅ Backend starts without errors
- ✅ Frontend compiles and loads
- ✅ Can create master password
- ✅ Can login successfully
- ✅ Dashboard displays correctly
- ✅ Can add test account
- ✅ Can add test list item
- ✅ Docker containers build and run
- ✅ API endpoints respond correctly

## 🚀 Next Steps

Once verified:
1. Read QUICKSTART.md for usage guide
2. Add your real Hive accounts
3. Configure your voting lists
4. Start the bot and monitor
5. Deploy to VPS (if needed)

## 📞 Getting Help

If you encounter issues:
1. Check error messages in terminal
2. Review browser console (F12)
3. Check Docker logs: `docker compose logs`
4. Verify configuration in .env
5. Review README.md for detailed docs
6. Check PROJECT_SUMMARY.md for architecture

## 🎉 Success!

If all checks pass, your SnapieVote installation is complete and ready to use!

---

**Built with ❤️ by MenO for the Hive Blockchain** 🐝
