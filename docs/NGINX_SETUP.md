# 🌐 Nginx Reverse Proxy Setup for SnapieVote

## Why Use Nginx?

Instead of accessing your bot at `http://your-vps-ip:3000`, you can use:
- ✅ Clean subdomain: `https://snapievote.yourdomain.com`
- ✅ SSL/HTTPS for security
- ✅ Hide port numbers
- ✅ Single port (80/443) instead of exposing 3000/5000

---

## Prerequisites

- ✅ Domain name (e.g., `yourdomain.com`)
- ✅ SnapieVote already installed and running
- ✅ Root/sudo access to VPS

---

## Step 1: Get a Subdomain

### Option A: Using Your Domain Registrar

1. **Login to your domain registrar** (Namecheap, GoDaddy, Cloudflare, etc.)
2. **Go to DNS settings**
3. **Add an A record:**
   - **Type:** A
   - **Name:** snapievote (or whatever you want)
   - **Value:** Your VPS IP address (e.g., 123.45.67.89)
   - **TTL:** 300 (5 minutes) or Auto

**Example:**
```
Type: A
Name: snapievote
Value: 123.45.67.89
TTL: 300
```

4. **Wait 5-10 minutes** for DNS to propagate

**Test it works:**
```bash
ping snapievote.yourdomain.com
# Should show your VPS IP
```

---

## Step 2: Install Nginx

```bash
# Update packages
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check it's running
sudo systemctl status nginx
```

**Test:** Visit `http://your-vps-ip` in browser - should see "Welcome to Nginx"

---

## Step 3: Create Nginx Config for SnapieVote

First, find out what ports your SnapieVote is using:

```bash
cd ~/SnapieVote  # or wherever you installed it
cat .env
```

You'll see something like:
```bash
BACKEND_PORT=5000
FRONTEND_PORT=3000
```

Now create the Nginx config:

```bash
sudo nano /etc/nginx/sites-available/snapievote
```

**Paste this config** (replace `snapievote.yourdomain.com` with YOUR subdomain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name snapievote.yourdomain.com;

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**If you're using different ports** (from your .env), change the numbers:
- Change `3000` to your `FRONTEND_PORT`
- Change `5000` to your `BACKEND_PORT`

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 4: Enable the Config

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/snapievote /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test config is valid
sudo nginx -t

# Should say: "syntax is okay" and "test is successful"

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 5: Test It Works

Open your browser and go to:
```
http://snapievote.yourdomain.com
```

You should see your SnapieVote login screen! 🎉

---

## Step 6: Add SSL (HTTPS) with Let's Encrypt

**Free SSL certificate from Let's Encrypt:**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (replace with YOUR subdomain)
sudo certbot --nginx -d snapievote.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms (Y)
# - Share email with EFF (optional, your choice)
# - Redirect HTTP to HTTPS? Choose 2 (Yes)
```

**That's it!** Certbot automatically:
- Gets SSL certificate
- Updates Nginx config
- Sets up auto-renewal

Now visit:
```
https://snapievote.yourdomain.com
```

**Green padlock!** 🔒✅

---

## Step 7: Update Frontend Config (Optional)

If you want the frontend to use the API through the subdomain:

```bash
cd ~/SnapieVote
nano frontend/.env
```

Change to:
```bash
REACT_APP_API_URL=https://snapievote.yourdomain.com/api
```

Then rebuild:
```bash
docker-compose restart frontend
```

---

## Firewall Setup

Make sure ports 80 and 443 are open:

```bash
# If using ufw
sudo ufw allow 'Nginx Full'
sudo ufw status

# If using iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save
```

**Optional:** Close direct access to ports 3000/5000:
```bash
sudo ufw delete allow 3000/tcp
sudo ufw delete allow 5000/tcp
```

Now users can ONLY access through your subdomain (more secure).

---

## Auto-Renewal Check

SSL certificates expire every 90 days. Certbot sets up auto-renewal automatically.

**Test auto-renewal:**
```bash
sudo certbot renew --dry-run
```

Should say: "Congratulations, all simulated renewals succeeded"

**Check cron job exists:**
```bash
sudo systemctl status certbot.timer
```

Should show "active (running)"

---

## Troubleshooting

### Can't access subdomain

**Check DNS:**
```bash
ping snapievote.yourdomain.com
# Should show your VPS IP
```

If not, wait longer (DNS can take up to 24 hours, usually 5-10 min)

**Check Nginx is running:**
```bash
sudo systemctl status nginx
```

**Check Nginx config:**
```bash
sudo nginx -t
```

**Check Nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

---

### "502 Bad Gateway"

**Backend/frontend not running:**
```bash
cd ~/SnapieVote
docker-compose ps

# Should show both "Up"
```

**Wrong ports in Nginx config:**
```bash
# Check what ports Docker is using
docker-compose ps | grep -E "PORTS"

# Update Nginx config to match
sudo nano /etc/nginx/sites-available/snapievote
sudo nginx -t
sudo systemctl reload nginx
```

---

### SSL certificate fails

**Port 80 blocked:**
```bash
sudo ufw status
# Make sure 80/tcp is ALLOW
```

**Domain not pointing to VPS yet:**
```bash
ping snapievote.yourdomain.com
# Must show your VPS IP
```

**Try again:**
```bash
sudo certbot --nginx -d snapievote.yourdomain.com --force-renewal
```

---

## Quick Reference

### Nginx Commands
```bash
# Test config
sudo nginx -t

# Reload (after config changes)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# Status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### SSL/Certbot Commands
```bash
# Renew all certificates
sudo certbot renew

# Test renewal (dry run)
sudo certbot renew --dry-run

# List certificates
sudo certbot certificates

# Revoke certificate
sudo certbot revoke --cert-name snapievote.yourdomain.com
```

---

## Multiple Subdomains?

Want to run multiple SnapieVote instances?

**Example: One for curation, one for anti-spam**

1. **Clone to different folder:**
   ```bash
   cd ~
   git clone <repo> SnapieVote-Curation
   git clone <repo> SnapieVote-AntiSpam
   ```

2. **Run install in each with different ports:**
   ```bash
   cd SnapieVote-Curation
   # Edit .env to use ports 3001, 5001
   ./install.sh
   
   cd ../SnapieVote-AntiSpam
   # Edit .env to use ports 3002, 5002
   ./install.sh
   ```

3. **Create separate Nginx configs:**
   ```bash
   sudo nano /etc/nginx/sites-available/snapievote-curation
   sudo nano /etc/nginx/sites-available/snapievote-antispam
   ```

4. **Get SSL for each:**
   ```bash
   sudo certbot --nginx -d curation.yourdomain.com
   sudo certbot --nginx -d antispam.yourdomain.com
   ```

---

## Summary Checklist

- [ ] Domain/subdomain pointing to VPS IP
- [ ] Nginx installed and running
- [ ] Config file created in sites-available
- [ ] Symlink created in sites-enabled
- [ ] Config tested with `nginx -t`
- [ ] Nginx reloaded
- [ ] Can access via subdomain (HTTP)
- [ ] SSL certificate installed via certbot
- [ ] Can access via HTTPS with green padlock
- [ ] Auto-renewal working

---

**Built with ❤️ by MenO for the Hive Blockchain** 🐝
