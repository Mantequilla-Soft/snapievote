# SnapieVote - Hive Blockchain Automation

Automated upvoting and downvoting bot for Hive blockchain with secure key management and customizable lists.

![SnapieVote](https://img.shields.io/badge/Snapie-Product-1DA1F2?style=for-the-badge&logo=twitter)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

## 🌟 Features

- **Two Lists System**
  - 👍 **Good List** - Auto-upvote your favorite authors, or accounts you are supporting. (please follow best practices)
  - 💩 **Shit List** - Auto-downvote problematic content, spammers and scammers

- **Secure Key Management**
  - AES-256 encryption for posting keys
  - Master password protection
  - Keys never stored in plain text

- **Smart Voting**
  - Voting power (VP) threshold management
  - Configurable vote weights per target
  - Customizable delays for organic voting patterns
  - Daily vote limits per target
  - Option to include/exclude comments

- **Resilient Operation**
  - Blockchain streaming with automatic reconnection
  - Block tracking via `lastblock.txt` for missed blocks
  - Pause/Resume functionality

- **Beautiful UI**
  - Old Twitter theme (nostalgia vibes)
  - Real-time VP monitoring
  - Vote history tracking
  - **Live log viewer** with color-coded events
  - Responsive design

- **Active/Pause Management**
  - Pause individual accounts without deleting
  - Pause list items temporarily
  - Clear visual indicators for paused items

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose (recommended for deployment)
- Hive account(s) with posting keys

### Local Development (Easy Mode!)

1. **Clone and run**
   ```bash
   git clone <your-repo>
   cd SnapieVote
   ./dev.sh
   ```

2. **Access the app**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

The `dev.sh` script automatically:
- Installs dependencies
- Creates `.env` file
- Starts both backend and frontend
- Handles cleanup on exit

### Custom Ports

If ports 3000 or 5000 are in use, create a `.env` file in the root:

```bash
# .env in project root
BACKEND_PORT=5001
FRONTEND_PORT=3001
```

Then run `./dev.sh` and it will use your custom ports.

### Advanced Dev Options

**Start from current blockchain block:**
```bash
./dev.sh --now
```

**Start from specific block (useful for testing old posts):**
```bash
./dev.sh --block 101212450
```

### Docker Deployment (Recommended for VPS)

**🚀 Easy Mode: Automated Installation**

```bash
git clone <your-repo>
cd SnapieVote
./install.sh
```

The install script automatically:
- ✅ Installs Docker & Docker Compose (if needed)
- ✅ Scans and finds available ports
- ✅ Generates secure JWT secret
- ✅ Builds containers
- ✅ Starts services
- ✅ Sets up auto-start on boot

**Manual Installation:**

1. **Prepare environment**
   ```bash
   # Backend config
   cd backend
   cp .env.example .env
   nano .env  # Set JWT_SECRET to a strong random string
   
   # Port config (optional)
   cd ..
   cp .env.example .env
   nano .env  # Change BACKEND_PORT and FRONTEND_PORT if needed
   ```

2. **Build and run**
   ```bash
   docker-compose up -d
   ```

3. **Access your app**
   - Frontend: http://your-vps-ip:3000 (or your custom port)
   - Backend: http://your-vps-ip:5000 (or your custom port)

4. **Stop the app**
   ```bash
   docker-compose down
   ```

## 📖 Usage Guide

### First Time Setup

1. **Open the app** - Navigate to your deployment URL
2. **Create master password** - This encrypts your posting keys (store it safely!)
3. **Login** - Use your master password

### Adding Voting Accounts

1. Go to **Accounts** tab
2. Click **Add Account**
3. Enter:
   - Your Hive username
   - Posting key (starts with `5...`)
   - Min VP threshold (default 70%)
4. Click **Add Account**

### Managing Lists

#### Good List (Upvotes)
1. Go to **Lists** tab → **Good List**
2. Click **Add User**
3. Configure:
   - Username to upvote
   - Vote weight (default 50%)
   - Delay in minutes
   - Max votes per day
   - Include comments (optional)

#### Shit List (Downvotes)
1. Go to **Lists** tab → **Shit List**
2. Click **Add User**
3. Configure:
   - Username to downvote
   - Vote weight (default 100%)
   - Delay in minutes
   - Max votes per day
   - Include comments (optional)

### Running the Bot

1. Go to **Overview** tab
2. Click the big **▶ START** button
3. Monitor:
   - Account VP levels
   - Recent votes cast
   - Bot status
   - **Live logs** showing detections and votes in real-time

4. Click **⏸ PAUSE** to stop automation

### Understanding the Logs

The log viewer shows color-coded events:
- 📝 **Orange** - Post/comment detected from your lists
- ✅ **Green** - Vote scheduled or executed successfully
- 🗳️ **Blue** - Vote execution in progress
- ⚠️ **Yellow** - Warnings (VP threshold, daily limits)
- ❌ **Red** - Errors (failed votes)

### Pausing Items

Instead of deleting, you can **pause** items:
- Click **⏸ Pause** button on any account or list item
- Paused items show a "Paused" badge
- Click **▶ Active** to resume
- Tab counts show "5/7" (active/total)

## 🔧 Configuration

### Backend Environment Variables

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
```

### Vote Weight Defaults

- **Good List**: 50% (customizable per target)
- **Shit List**: 100% (customizable per target)

### VP Thresholds

- Set minimum VP per account (e.g., 70%)
- Bot only votes when VP is above threshold
- Both upvotes and downvotes respect thresholds

## 🏗️ Architecture

```
SnapieVote/
├── backend/
│   ├── services/
│   │   ├── database.js      # SQLite operations
│   │   ├── encryption.js    # AES-256 encryption
│   │   ├── hive.js          # Blockchain interaction
│   │   └── voting.js        # Voting logic & streaming
│   ├── routes/
│   │   ├── auth.js          # Authentication
│   │   ├── accounts.js      # Account management
│   │   ├── lists.js         # List management
│   │   └── bot.js           # Bot control
│   ├── middleware/
│   │   └── auth.js          # JWT middleware
│   ├── data/
│   │   ├── snapievote.db    # SQLite database
│   │   └── lastblock.txt    # Block tracking
│   └── server.js            # Express server
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/        # Login & Setup
│   │   │   └── Dashboard/   # Main UI components
│   │   ├── services/
│   │   │   └── api.js       # API client
│   │   └── App.js           # Main app
│   └── public/
│
└── docker-compose.yml       # Docker orchestration
```

## 🔒 Security

- **Encryption**: AES-256-CBC for posting keys
- **Authentication**: JWT tokens with master password
- **Key Derivation**: Scrypt for password-to-key conversion
- **No Plain Text**: Keys never stored unencrypted
- **Session Management**: 24-hour token expiry

⚠️ **Important**: Never share your master password. If lost, encrypted keys cannot be recovered.

## 📊 Database Schema

- **accounts** - Your voting accounts with encrypted keys
- **good_list** - Upvote targets with settings
- **shit_list** - Downvote targets with settings
- **vote_history** - Complete vote log
- **daily_vote_count** - Track daily limits
- **bot_status** - Runtime state
- **master_password** - Hashed master password

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/setup` - Initial setup
- `POST /api/auth/login` - Login
- `GET /api/auth/check-setup` - Check if setup needed

### Accounts (Protected)
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Add account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/:username/vp` - Get VP

### Lists (Protected)
- `GET /api/lists/good` - Get Good List
- `POST /api/lists/good` - Add to Good List
- `PUT /api/lists/good/:id` - Update Good List item
- `DELETE /api/lists/good/:id` - Remove from Good List
- `GET /api/lists/shit` - Get Shit List
- `POST /api/lists/shit` - Add to Shit List
- `PUT /api/lists/shit/:id` - Update Shit List item
- `DELETE /api/lists/shit/:id` - Remove from Shit List

### Bot Control (Protected)
- `POST /api/bot/start` - Start bot
- `POST /api/bot/stop` - Stop bot
- `GET /api/bot/status` - Get bot status
- `GET /api/bot/history` - Get vote history
- `GET /api/bot/logs` - Get real-time logs

## 🐛 Troubleshooting

### Bot won't start
- Check master password is correct
- Ensure at least one account is added
- Check backend logs: `docker-compose logs backend`

### Votes not happening
- Verify VP is above threshold
- Check list item is **active** (not paused)
- Check daily vote limit not reached
- Ensure bot is running (green indicator)
- Check logs for detection messages
- Verify "Include comments" checkbox if voting on comments

### Connection issues
- Bot auto-reconnects after 30 seconds
- Check `backend/lastblock.txt` for continuity
- Verify Hive RPC nodes are accessible

### Bot stuck on old blocks
- Use `./dev.sh --now` to jump to current blockchain
- Check logs to see current block processing
- Delete `backend/lastblock.txt` and restart

### Frontend not loading
- Check backend is running: `curl http://localhost:5000/api/health`
- Clear browser cache
- Check browser console for errors

## 🚀 VPS Deployment with Subdomain

1. **Setup subdomain**
   - Point subdomain to your VPS IP (e.g., `snapievote.yourdomain.com`)

2. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Clone and configure**
   ```bash
   git clone <your-repo>
   cd SnapieVote
   cd backend && cp .env.example .env
   nano .env  # Set strong JWT_SECRET
   ```

4. **Setup Nginx reverse proxy** (optional)
   ```nginx
   server {
       listen 80;
       server_name snapievote.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
       }
   }
   ```

5. **Start services**
   ```bash
   docker-compose up -d
   ```

6. **Setup SSL** (recommended)
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d snapievote.yourdomain.com
   ```

## 📝 License

MIT License - Use freely, attribution appreciated!

## 🤝 Contributing

Contributions welcome! This is an MVP, plenty of room for improvements.

## ⚠️ Disclaimer

Use responsibly. Automated voting should align with Hive community guidelines. The developers are not responsible for misuse.

## 📞 Support

For issues and questions, open a GitHub issue.

---

Made with ❤️ by MenO  | Powered by Hive Blockchain
