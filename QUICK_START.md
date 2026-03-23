# 🚀 Quick Start Guide

## Running the Full Stack App

You have **3 options** to run both frontend and backend:

---

## Option 1: Single Command (Easiest) ⭐

Run both servers at once with one command:

```bash
npm run dev:all
```

This uses `concurrently` to run both:
- Backend on **http://localhost:5001**
- Frontend on **http://localhost:3000**

**Pros**: 
- One command
- See both server logs in one terminal
- Easy to stop (Ctrl+C stops both)

**Cons**: 
- Logs from both servers are mixed together

---

## Option 2: Two Separate Terminals (Recommended)

### Terminal 1 - Backend
```bash
cd server
npm run dev
```
Backend runs on **http://localhost:5001/api**

### Terminal 2 - Frontend  
```bash
npm run dev
```
Frontend runs on **http://localhost:3000**

**Pros**:
- Clean separation of logs
- Easy to see backend vs frontend errors
- Can restart one without affecting the other

**Cons**:
- Need two terminal windows

---

## Option 3: Background Processes

### Start Backend in Background
```bash
cd server && npm run dev &
```

### Start Frontend
```bash
npm run dev
```

### Stop Background Backend
```bash
# Find the process
ps aux | grep "node.*index.js"

# Kill it (replace PID with actual process ID)
kill <PID>
```

---

## Verify Both Are Running

### Check Backend
```bash
curl http://localhost:5001/api
```

Should return:
```json
{
  "message": "Rentra API",
  "version": "1.0.0",
  "endpoints": {...}
}
```

### Check Frontend
Open browser to: **http://localhost:3000**

You should see the Rentra app login page.

---

## Troubleshooting

### Port Already in Use

**Backend (Port 5001)**
```bash
# Find process using port 5001
lsof -ti:5001

# Kill it
lsof -ti:5001 | xargs kill -9
```

**Frontend (Port 3000)**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill it
lsof -ti:3000 | xargs kill -9
```

### Backend Not Connecting to Database

Check your `server/.env` has:
```bash
DATABASE_URL=postgresql://...
```

Test database connection:
```bash
cd server
npx prisma studio
```

### Frontend Can't Reach Backend

1. Check backend is running: `curl http://localhost:5001/api`
2. Check frontend .env has: `VITE_API_URL=http://localhost:5001/api`
3. Open browser dev tools → Network tab
4. Try to login and see if API calls are reaching backend

### "Module not found" Errors

**Backend**
```bash
cd server
npm install
```

**Frontend**
```bash
npm install
```

---

## Development Workflow

### Recommended: Use Two Terminals

**Terminal 1** (left side):
```bash
cd /Users/ethanhuynh/projects/rentra/server
npm run dev
```

**Terminal 2** (right side):
```bash
cd /Users/ethanhuynh/projects/rentra
npm run dev
```

### Watch the logs:
- **Terminal 1**: Backend API requests, database queries, errors
- **Terminal 2**: Frontend build output, hot reload, React errors

---

## Testing the Connection

### 1. Start Both Servers
Choose your preferred method above.

### 2. Open Browser
Go to: **http://localhost:3000**

### 3. Open Browser DevTools
- Press `F12` or `Cmd+Option+I` (Mac)
- Go to **Console** tab
- Go to **Network** tab

### 4. Try to Register
- Click "Sign Up"
- Fill in the form (use a `.edu` email)
- Click "Register"

### 5. Check Network Tab
You should see:
- `POST http://localhost:5001/api/auth/register`
- Status: **201** (success) or **400** (validation error)

### 6. Check Backend Terminal
You should see:
```
POST /api/auth/register 201 - - ms
✅ Verification email sent to user@student.edu
```

---

## Environment Variables

### Backend (`server/.env`)
Already encrypted with dotenvx. Key variables:
- `PORT=5001`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`

### Frontend (`.env`)
Already encrypted with dotenvx. Key variables:
- `VITE_API_URL=http://localhost:5001/api`
- `VITE_API_TIMEOUT=30000`

Both are automatically decrypted by dotenvx when you run `npm run dev`.

---

## Quick Commands Reference

```bash
# Start both servers at once
npm run dev:all

# Start backend only
cd server && npm run dev

# Start frontend only
npm run dev

# Run tests
npm test

# Check linting
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Next Steps

Once both servers are running:

1. ✅ Test authentication (register, login, logout)
2. ✅ Browse properties (listings integration - next task)
3. ✅ Submit applications
4. ✅ Send messages
5. ✅ Test full user flows

---

## Pro Tips

### Hot Reload
Both servers support hot reload:
- **Backend**: Nodemon watches for file changes
- **Frontend**: Vite HMR (Hot Module Replacement)

### Debugging
**Backend**: Add `console.log()` or use Node debugger
**Frontend**: Use React DevTools browser extension

### Database
View your data in real-time:
```bash
cd server
npx prisma studio
```
Opens at: **http://localhost:5555**

---

## Summary

**Easiest way to start:**
```bash
npm run dev:all
```

**Best for development:**
- Terminal 1: `cd server && npm run dev`
- Terminal 2: `npm run dev`

**Access points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api
- Database UI: http://localhost:5555 (prisma studio)

Happy coding! 🚀
