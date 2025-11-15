# 🔐 Understanding Passwords and Secrets in SnapieVote

## Two Different Things!

SnapieVote uses **two separate security layers**, and they serve different purposes:

---

## 1. 🔑 Master Password (Your Password)

**What you create on first login**

### Purpose:
- Encrypts your Hive posting keys in the database
- Only YOU know this password
- Never stored anywhere (only a hash for verification)

### Used For:
- Logging into the dashboard
- Starting the bot (needs to decrypt posting keys)
- Encrypting/decrypting account keys

### Example:
```
Master Password: "MySecurePassword123!"
```

When you add a Hive account:
1. You enter your posting key: `5Jxxx...`
2. SnapieVote encrypts it with your master password
3. Stores encrypted version in database: `a8f3d...` (unreadable)

**If you lose this password:** 😱 All your encrypted keys are lost forever!

---

## 2. 🎫 JWT Secret (App Secret)

**Auto-generated random string in backend/.env**

### Purpose:
- Signs authentication tokens (session cookies)
- Prevents hackers from forging login tokens
- Server-side security

### Used For:
- Creating session tokens when you log in
- Verifying you're still logged in on each request
- Preventing session hijacking

### Example:
```env
JWT_SECRET=02814d114e1b910db2fd16018b3e0548e05c4e81ec5e5474df50f8c195ae393c
```

### How It Works:

1. **You log in** with master password
2. **Backend verifies** password is correct
3. **Backend creates** a JWT token signed with JWT_SECRET
4. **Token sent to browser** (stored in localStorage)
5. **Every request** includes this token
6. **Backend verifies** token signature with JWT_SECRET

**If someone steals the JWT_SECRET:** They could forge login tokens!

---

## 🔒 Visual Explanation

```
┌─────────────────────────────────────────────┐
│  YOU                                        │
│  Master Password: "MyPassword123!"         │
│  (You remember this)                       │
└─────────────────┬───────────────────────────┘
                  │
                  │ Login
                  ↓
┌─────────────────────────────────────────────┐
│  SNAPIEVOTE BACKEND                         │
│                                             │
│  1. Verify password ✓                      │
│  2. Create JWT Token                       │
│     Token = sign(userdata, JWT_SECRET)     │
│  3. Send token to browser                  │
└─────────────────┬───────────────────────────┘
                  │
                  │ Token: eyJhbGc...
                  ↓
┌─────────────────────────────────────────────┐
│  BROWSER                                    │
│  Stores token in localStorage               │
│                                             │
│  Every API request includes token           │
└─────────────────┬───────────────────────────┘
                  │
                  │ API Request + Token
                  ↓
┌─────────────────────────────────────────────┐
│  SNAPIEVOTE BACKEND                         │
│                                             │
│  1. Verify token signature using JWT_SECRET│
│  2. Check if token expired (24 hours)      │
│  3. Allow request if valid ✓               │
└─────────────────────────────────────────────┘
```

---

## 🔐 For Posting Keys

```
┌─────────────────────────────────────────────┐
│  YOU ADD ACCOUNT                            │
│  Username: meno                             │
│  Posting Key: 5Jxxx... (plain text)       │
└─────────────────┬───────────────────────────┘
                  │
                  │ Encrypt
                  ↓
┌─────────────────────────────────────────────┐
│  ENCRYPTION SERVICE                         │
│                                             │
│  Input:  Posting Key + Master Password     │
│  Output: Encrypted Key + IV                │
│                                             │
│  Algorithm: AES-256-CBC                    │
└─────────────────┬───────────────────────────┘
                  │
                  │ Encrypted data
                  ↓
┌─────────────────────────────────────────────┐
│  DATABASE                                   │
│  username: meno                             │
│  encrypted_key: a8f3d9c2e1...              │
│  iv: b7a4f8d...                            │
└─────────────────────────────────────────────┘
```

When bot needs to vote:
1. Master password entered when you hit START
2. Decrypt posting key using master password
3. Use plain posting key to sign vote transaction
4. Send to Hive blockchain

---

## ❓ Common Questions

### Q: Why do I need to enter my password to start the bot?

**A:** Because the posting keys are encrypted! The bot needs your master password to decrypt them so it can vote.

### Q: Why can't the bot remember my password?

**A:** Security! If we stored your password, anyone with access to the server could read it. You have to enter it each time you start the bot.

### Q: What happens if I change the JWT_SECRET?

**A:** All existing login tokens become invalid. Everyone gets logged out and needs to log in again. Your encrypted posting keys are safe (they use master password, not JWT_SECRET).

### Q: What happens if I forget my master password?

**A:** 😱 You're locked out! You'll need to:
1. Delete the database: `rm backend/data/snapievote.db`
2. Run setup again
3. Re-add all accounts (you'll need posting keys again)

### Q: Can I change my master password?

**A:** Not currently implemented, but you would need to:
1. Decrypt all keys with old password
2. Re-encrypt with new password
3. Update password hash in database

---

## 🛡️ Security Best Practices

### Master Password:
- ✅ Use a password manager
- ✅ Make it strong (16+ characters)
- ✅ Never share it
- ✅ Write it down in a safe place as backup
- ❌ Don't store in browser autofill

### JWT Secret:
- ✅ Keep backend/.env secure
- ✅ Never commit to git (in .gitignore)
- ✅ Generate new one if compromised
- ✅ Use random 32+ character hex
- ❌ Don't share or expose publicly

### Posting Keys:
- ✅ Only use posting keys (not active/owner!)
- ✅ Review what posting key can do (vote, comment, post)
- ✅ Keep original backup somewhere safe
- ❌ Never store unencrypted anywhere

---

## 🔄 What Gets Stored Where?

```
backend/.env:
├── JWT_SECRET (for tokens) ←────────┐
├── PORT                              │
└── NODE_ENV                          │
                                      │
backend/data/snapievote.db:           │
├── master_password (hashed) ←────────┤───── Different!
├── encrypted_posting_keys            │
├── voting_lists                      │
└── vote_history                      │
                                      │
Your Brain:                           │
└── Master Password ←──────────────────┘
```

---

## 🎯 Summary

| Item | Purpose | Who Knows It | Where Stored |
|------|---------|--------------|--------------|
| **Master Password** | Encrypt posting keys | YOU only | Your brain + password hash in DB |
| **JWT Secret** | Sign login tokens | Server only | backend/.env |
| **Posting Keys** | Vote on Hive | Encrypted in DB | Database (encrypted) |
| **JWT Tokens** | Prove you're logged in | Browser | Browser localStorage |

---

**Built with ❤️ by MenO for the Hive Blockchain** 🐝
