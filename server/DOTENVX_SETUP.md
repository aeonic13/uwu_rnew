# dotenvx Encryption Setup

Your `.env` file is now encrypted for security! 🔒

## What Changed

- ✅ `.env` file is encrypted with public-key encryption
- ✅ `.env.keys` contains the private decryption key (gitignored)
- ✅ All npm scripts now use `dotenvx run` to decrypt on-the-fly
- ✅ Secrets are safe to commit to git

## Important Files

### `.env` (Safe to commit ✅)

Contains encrypted environment variables. This can be committed to git.

### `.env.keys` (DO NOT COMMIT ❌)

Contains the private key needed to decrypt `.env`. This file is gitignored.

**Private Key:**

```
DOTENV_PRIVATE_KEY=<your-private-key-from-.env.keys>
```

⚠️ **IMPORTANT**: Store this key securely! Save it in:

- Your password manager (1Password, LastPass, etc.)
- Team secrets manager (Doppler, Vault, etc.)
- Secure note shared with team members

## How It Works

When you run `npm run dev`, dotenvx automatically:

1. Reads the encrypted `.env` file
2. Uses the private key from `.env.keys` to decrypt
3. Loads decrypted values into environment variables
4. Runs your application

## Development Usage

### Running the Server

```bash
# Development mode (auto-decrypts)
npm run dev

# Production mode
npm start

# The private key is loaded from .env.keys automatically
```

### For New Team Members

1. Get the private key from the team lead
2. Create `.env.keys` file in `server/` directory:

```bash
cat > .env.keys << 'EOF'
#/------------------!DOTENV_PRIVATE_KEYS!-------------------/
#/ private decryption keys. DO NOT commit to source control /
#/----------------------------------------------------------/

# .env
DOTENV_PRIVATE_KEY=<your-private-key-from-.env.keys>
EOF
```

3. Run the server: `npm run dev`

### Manual Decryption (if needed)

```bash
# Test decryption manually
dotenvx get DATABASE_URL

# Run any command with decrypted env
dotenvx run -- node index.js
```

## Production Deployment

### Option 1: Use Environment Variables

Set `DOTENV_PRIVATE_KEY` as an environment variable on your hosting platform:

**Railway/Render/Heroku:**

```bash
DOTENV_PRIVATE_KEY=<your-private-key-from-.env.keys>
```

### Option 2: Inject at Build Time

```bash
# In CI/CD or deployment
DOTENV_PRIVATE_KEY='<your-private-key-from-.env.keys>' npm start
```

### Option 3: Use Unencrypted .env

For production, you can also use a standard unencrypted `.env` file with secrets from your hosting platform's secret manager.

## Managing Secrets

### Adding New Secrets

```bash
# Edit .env (will be encrypted on save if using dotenvx edit)
dotenvx set NEW_SECRET=value

# Or manually edit and re-encrypt
nano .env
dotenvx encrypt
```

### Rotating Keys

```bash
# Generate new encryption key
dotenvx rekey

# This creates a new private key and re-encrypts .env
# Share the new key with team members
```

### Viewing Current Values

```bash
# View all decrypted values
dotenvx get

# View specific value
dotenvx get DATABASE_URL
```

## Security Best Practices

1. ✅ **DO**: Commit encrypted `.env` to git
2. ✅ **DO**: Store private key in password manager
3. ✅ **DO**: Share private key securely (encrypted chat, secure notes)
4. ❌ **DON'T**: Commit `.env.keys` to git
5. ❌ **DON'T**: Share private key in plain text
6. ❌ **DON'T**: Hardcode private key in scripts

## Backup & Recovery

### Backup the Private Key

```bash
# Option 1: Copy to password manager
cat .env.keys

# Option 2: Use dotenvx backup (requires account)
dotenvx ops backup
```

### Recovery

If you lose `.env.keys`:

1. Get the private key from team lead or backup
2. Recreate `.env.keys` file with the key
3. Run `npm run dev` to verify it works

## Troubleshooting

### Error: "Missing DOTENV_PRIVATE_KEY"

**Solution**: Create `.env.keys` file with the private key

### Error: "Failed to decrypt"

**Causes**:

- Wrong private key
- Corrupted .env file
- Missing DOTENV_PUBLIC_KEY in .env

**Solution**: Verify private key matches, check .env has DOTENV_PUBLIC_KEY at top

### Server won't start

**Solution**: Temporarily use unencrypted .env for debugging:

```bash
# Rename encrypted .env
mv .env .env.encrypted

# Create plain .env
cp .env.example .env
# Fill in real values
nano .env

# Start server
node index.js
```

## Migration Back (if needed)

To remove encryption:

```bash
# Decrypt .env to plain text
dotenvx decrypt .env > .env.plain
mv .env.plain .env

# Remove encryption files
rm .env.keys

# Update package.json scripts (remove 'dotenvx run --')
```

## Resources

- [dotenvx Documentation](https://dotenvx.com)
- [Encryption Guide](https://dotenvx.com/encryption)
- [CLI Reference](https://dotenvx.com/docs/cli)

---

**Current Status**: ✅ Encrypted and ready for development
**Private Key**: Stored in `.env.keys` (gitignored)
**Team Setup**: Share private key with new developers securely
