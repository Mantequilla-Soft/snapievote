# 🚀 SnapieVote - Quick Start Guide

## What You Have Now

A fully functional Hive blockchain automation app with:

✅ **Backend** (Node.js + Express)
- Secure posting key encryption (AES-256)
- Hive blockchain streaming
- SQLite database
- REST API with JWT authentication
- Voting power management
- Block tracking with `lastblock.txt`

✅ **Frontend** (React)
- Old Twitter theme (blue #1DA1F2)
- Password-protected dashboard
- Account management
- Good List & Shit List management
- Real-time VP monitoring
- Vote history tracking
- Big START/PAUSE button

✅ **Docker Setup**
- Production-ready containers
- Nginx reverse proxy for frontend
- Volume mounts for data persistence
- Easy VPS deployment

## How to Run

### Development (Local Testing)

**Option 1: Quick Start Script (Recommended)**
```bash
./dev.sh
```
This starts both backend and frontend together. Press Ctrl+C to stop both.

**Option 2: Manual Start (Two Terminals)**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

Then open: http://localhost:3000

### Production (VPS with Docker)

```bash
# Setup environment
cd backend
cp .env.example .env
nano .env  # Set strong JWT_SECRET

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access at: http://your-vps-ip:3000

## First Time Setup

1. **Open the app** → You'll see the setup screen
2. **Create master password** → This encrypts ALL your posting keys
3. **Login** with your master password
4. **Add voting accounts**:
   - Go to Accounts tab
   - Add your Hive username + posting key
   - Set min VP threshold (default 70%)
5. **Create lists**:
   - Good List: Users to upvote
   - Shit List: Users to downvote
6. **Hit START** → Bot begins monitoring blockchain

## Key Features Explained

### Vote Weight Defaults
- **Good List**: 50% (you can change per user)
- **Shit List**: 100% (you can change per user)

### VP Threshold
- Set per account (e.g., 70%)
- Bot only votes when VP > threshold
- Prevents wasting voting power

### Delays
- Configurable per user
- Makes voting look organic
- Default: 5 minutes after post

### Daily Limits
- Max votes per target per day
- Prevents spam accusations
- Tracked automatically

### Block Tracking
- `lastblock.txt` saves last processed block
- If connection drops, resumes from last block
- Never misses a post

## Project Structure

```
SnapieVote/
├── backend/
│   ├── services/          # Core logic
│   │   ├── database.js    # SQLite
│   │   ├── encryption.js  # AES-256
│   │   ├── hive.js        # Blockchain
│   │   └── voting.js      # Automation
│   ├── routes/            # API endpoints
│   ├── data/              # DB & lastblock.txt
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/      # Login/Setup
│   │   │   └── Dashboard/ # Main UI
│   │   └── services/
│   │       └── api.js     # API client
│   └── public/
│
├── docker-compose.yml
├── start-dev.sh
└── README.md
```

## Environment Variables

**backend/.env**
```env
PORT=5000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

For production, generate a strong JWT_SECRET:
```bash
openssl rand -hex 32
```

## Troubleshooting

### "Cannot find module" errors
```bash
cd backend && npm install
cd frontend && npm install
```

### Backend won't start
- Check if port 5000 is available
- Ensure .env file exists in backend/
- Check JWT_SECRET is set

### Frontend won't connect
- Ensure backend is running first
- Check backend is on http://localhost:5000
- Clear browser cache

### Bot not voting
- Verify accounts are added and active
- Check VP is above threshold
- Ensure users are in lists and active
- Confirm bot is started (green indicator)

### Docker issues
```bash
# Rebuild containers
docker-compose up --build -d

# Check logs
docker-compose logs backend
docker-compose logs frontend

# Reset everything
docker-compose down -v
docker-compose up -d
```

## API Testing

Health check:
```bash
curl http://localhost:5000/api/health
```

Check setup status:
```bash
curl http://localhost:5000/api/auth/check-setup
```

## Security Notes

⚠️ **IMPORTANT**:
- Master password encrypts ALL posting keys
- If you lose it, keys cannot be recovered
- Store it in a password manager
- Never share your master password
- Never commit .env files to git

## Next Steps

1. ✅ Setup master password
2. ✅ Add your Hive accounts
3. ✅ Populate Good List and/or Shit List
4. ✅ Configure vote weights and delays
5. ✅ Hit START and monitor

## VPS Deployment Checklist

- [ ] Clone repo to VPS
- [ ] Setup .env with strong JWT_SECRET
- [ ] Configure domain/subdomain DNS
- [ ] Install Docker & Docker Compose
- [ ] Run `docker-compose up -d`
- [ ] Setup Nginx reverse proxy (optional)
- [ ] Setup SSL with Let's Encrypt (optional)
- [ ] Test access via domain
- [ ] Create master password
- [ ] Add accounts and lists
- [ ] Start bot

## Support

Check README.md for detailed documentation.

For issues, check:
1. Backend logs: `docker-compose logs backend`
2. Frontend console (F12 in browser)
3. Database: `backend/data/snapievote.db`
4. Block tracking: `backend/data/lastblock.txt`

---

**Built with ❤️ by MenO for the Hive Blockchain** 🐝
