# 🔒 Environment Variable Encryption Setup

Your Rentra project now uses **dotenvx** for secure environment variable encryption!

## What Was Done

✅ Installed `dotenvx` globally  
✅ Encrypted both frontend and backend `.env` files  
✅ Created `.env.keys` files (gitignored)  
✅ Updated all npm scripts to use dotenvx  
✅ Tested server startup with encryption  

---

## Private Keys (SAVE THESE SECURELY!)

### Backend Private Key
```
DOTENV_PRIVATE_KEY=d0bc43c3f25f8a5bdd94409a8761cbb158e25a33eb4d93364b1bf786c8801059
```

### Frontend Private Key
```
DOTENV_PRIVATE_KEY=6bc4ba77b99fb62a1ce15f5ea3dfac6c1842b1611e7b61ef11bd17dec8816145
```

⚠️ **CRITICAL**: Save these keys in your password manager NOW!

---

## How It Works

### Before (Insecure)
```
.env                  # Plain text secrets
.gitignore            # Prevents committing .env
```
**Problem**: Secrets not in version control, hard to share with team

### After (Secure)
```
.env                  # Encrypted secrets (safe to commit!)
.env.keys             # Private key (gitignored, share securely)
```
**Benefits**: 
- Encrypted secrets in git
- Easy team onboarding
- Production-ready security

---

## Development Usage

### Starting the Project

**Backend:**
```bash
cd server
npm run dev
# dotenvx automatically decrypts .env
```

**Frontend:**
```bash
npm run dev
# dotenvx automatically decrypts .env
```

**Full Stack:**
```bash
npm run dev:all
# Runs both with encryption
```

Everything works exactly as before, but now your secrets are encrypted!

---

## For New Team Members

When onboarding new developers:

1. **Share private keys securely** (encrypted message, 1Password, etc.)

2. **Create `.env.keys` file in backend:**
```bash
cd server
cat > .env.keys << 'EOF'
#/------------------!DOTENV_PRIVATE_KEYS!-------------------/
#/ private decryption keys. DO NOT commit to source control /
#/----------------------------------------------------------/

# .env
DOTENV_PRIVATE_KEY=d0bc43c3f25f8a5bdd94409a8761cbb158e25a33eb4d93364b1bf786c8801059
EOF
```

3. **Create `.env.keys` file in frontend:**
```bash
cd /Users/ethanhuynh/projects/rentra
cat > .env.keys << 'EOF'
#/------------------!DOTENV_PRIVATE_KEYS!-------------------/
#/ private decryption keys. DO NOT commit to source control /
#/----------------------------------------------------------/

# .env
DOTENV_PRIVATE_KEY=6bc4ba77b99fb62a1ce15f5ea3dfac6c1842b1611e7b61ef11bd17dec8816145
EOF
```

4. **Run the project:**
```bash
npm run dev:all
```

---

## Verification

### Check Encryption Status

**Backend:**
```bash
cd server
head -5 .env
# Should show: DOTENV_PUBLIC_KEY="..." and encrypted values
```

**Frontend:**
```bash
head -5 .env
# Should show: DOTENV_PUBLIC_KEY="..." and encrypted values
```

### Test Decryption

```bash
# Backend
cd server
dotenvx get DATABASE_URL
# Should show: postgresql://...

# Frontend
dotenvx get VITE_API_URL
# Should show: http://localhost:5001/api
```

---

## Production Deployment

### Railway / Render / Heroku

Set environment variables:

**Backend:**
```bash
DOTENV_PRIVATE_KEY=d0bc43c3f25f8a5bdd94409a8761cbb158e25a33eb4d93364b1bf786c8801059
```

**Frontend (if deploying separately):**
```bash
DOTENV_PRIVATE_KEY=6bc4ba77b99fb62a1ce15f5ea3dfac6c1842b1611e7b61ef11bd17dec8816145
```

The encrypted `.env` file will be in your git repo, and the private key in the environment variable will decrypt it automatically.

---

## Security Best Practices

### ✅ DO

- Commit encrypted `.env` files to git
- Store private keys in password manager
- Share keys via encrypted channels
- Use different keys for frontend/backend
- Backup keys in multiple secure locations

### ❌ DON'T

- Commit `.env.keys` files to git
- Share keys in plain text (Slack, email, etc.)
- Hardcode keys in scripts or code
- Lose the private keys (no recovery!)

---

## Managing Secrets

### Add New Secret
```bash
# Backend
cd server
dotenvx set NEW_SECRET=value

# Frontend
dotenvx set VITE_NEW_SECRET=value
```

### View Current Secrets
```bash
# Backend
cd server
dotenvx get

# Frontend
dotenvx get
```

### Rotate Keys (Annual Best Practice)
```bash
# Backend
cd server
dotenvx rekey

# Frontend
dotenvx rekey

# Share new keys with team
```

---

## Troubleshooting

### "Missing DOTENV_PRIVATE_KEY" Error

**Cause**: `.env.keys` file missing or empty

**Solution**:
```bash
# Create .env.keys with the private key (see above)
cat .env.keys  # Should show DOTENV_PRIVATE_KEY
```

### Server Won't Start

**Quick Fix** (for debugging):
```bash
# Backend
cd server
mv .env .env.encrypted
cp .env.example .env
# Fill in values manually
npm run dev  # Use node index.js to bypass dotenvx
```

### Check If dotenvx is Installed
```bash
dotenvx --version
# Should show: @dotenvx/dotenvx@x.x.x

# If not installed:
npm install -g @dotenvx/dotenvx
```

---

## Files Changed

### Backend (`server/`)
- ✅ `.env` - Encrypted (safe to commit)
- ✅ `.env.keys` - Private key (gitignored)
- ✅ `package.json` - Scripts updated to use dotenvx
- ✅ `DOTENVX_SETUP.md` - Detailed guide

### Frontend (root)
- ✅ `.env` - Encrypted (safe to commit)
- ✅ `.env.keys` - Private key (gitignored)
- ✅ `package.json` - Scripts updated to use dotenvx

### Git Ignore
- ✅ `.env.keys` added to `.gitignore` (both locations)

---

## Resources

- **Documentation**: [dotenvx.com](https://dotenvx.com)
- **Backend Guide**: `server/DOTENVX_SETUP.md`
- **Support**: [dotenvx.com/docs](https://dotenvx.com/docs)

---

## Summary

🎉 **Your secrets are now encrypted and secure!**

- `.env` files are encrypted and **safe to commit**
- Private keys are in `.env.keys` (gitignored)
- All scripts work exactly as before
- Easy team onboarding
- Production-ready

**Action Items:**
1. ✅ Save both private keys to password manager
2. ✅ Test: Run `npm run dev` (both frontend and backend)
3. ✅ Commit encrypted `.env` files to git
4. ⏳ Share keys with team members securely

---

**Status**: ✅ Complete and tested  
**Date**: February 25, 2026  
**Next**: Share private keys with team via secure channel
