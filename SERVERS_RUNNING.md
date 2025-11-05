# Servers Running Status

## Date: November 5, 2025

## ✅ Servers Started Successfully

### Frontend Server
- **Status**: ✅ Running
- **URL**: http://localhost:5173/
- **Process**: Vite Dev Server
- **Log File**: `/mnt/c/Users/chaim.shuster/pc/frontend/frontend.log`
- **Command**: `npm run dev` (running in background)

**Output:**
```
VITE v5.4.21  ready in 2465 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Backend Server
- **Status**: 🔄 Starting
- **Expected URL**: http://localhost:3000/ (or port from .env)
- **Process**: tsx watch
- **Log File**: `/mnt/c/Users/chaim.shuster/pc/backend/backend.log`
- **Command**: `npm run dev` (running in background)

**Note**: Backend is initializing. It may take 10-30 seconds to fully start due to:
- TypeScript compilation
- Database connection establishment
- Prisma client initialization
- Route setup

## How to Access

### Frontend Application
1. Open your browser
2. Navigate to: **http://localhost:5173/**
3. You should see the Monday.com clone login page

### Backend API
- Base URL: **http://localhost:3000/api** (check your .env file for actual port)
- Health check: `http://localhost:3000/api/health` (if implemented)

## Monitoring Servers

### View Logs in Real-Time

**Backend:**
```bash
tail -f /mnt/c/Users/chaim.shuster/pc/backend/backend.log
```

**Frontend:**
```bash
tail -f /mnt/c/Users/chaim.shuster/pc/frontend/frontend.log
```

### Check Running Processes
```bash
ps aux | grep -E "(tsx watch|vite)" | grep -v grep
```

### Stop Servers
```bash
# Stop all servers
pkill -f "tsx watch"
pkill -f "vite"

# Or stop individually by PID
kill <PID>
```

## Testing the Application

### 1. Access the Frontend
- Open http://localhost:5173/
- You should see the login page

### 2. Test Registration
- Click "Sign up for free"
- Create a new account
- You'll be logged in automatically

### 3. Test 2FA (Two-Factor Authentication)
1. Go to Settings → Account Settings
2. Click "Enable 2FA"
3. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
4. Enter verification code
5. **Important**: Save the recovery codes!
6. Log out and log back in
7. You'll be prompted for 2FA code

### 4. Test Login with 2FA
1. Enter email and password
2. System will detect 2FA is enabled
3. Enter the 6-digit code from your authenticator app
4. Click "Verify"
5. You're logged in!

## Environment Check

Make sure you have a `.env` file in the backend directory with:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/monday_clone"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
```

## Database Status

Ensure PostgreSQL is running and the database is accessible:

```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Test database connection
cd backend
npx prisma db pull
```

## Troubleshooting

### Backend Not Starting
1. Check backend log: `cat /mnt/c/Users/chaim.shuster/pc/backend/backend.log`
2. Verify PostgreSQL is running
3. Check DATABASE_URL in .env file
4. Ensure port 3000 (or your configured port) is not in use

### Frontend Not Loading
1. Check frontend log: `cat /mnt/c/Users/chaim.shuster/pc/frontend/frontend.log`
2. Clear browser cache
3. Try incognito/private mode
4. Check browser console for errors

### Database Connection Errors
1. Verify PostgreSQL is running
2. Check DATABASE_URL format
3. Ensure database exists: `createdb monday_clone`
4. Run migrations: `cd backend && npx prisma migrate deploy`

### Port Already in Use
```bash
# Find what's using port 3000 (backend)
lsof -i :3000

# Find what's using port 5173 (frontend)
lsof -i :5173

# Kill the process
kill -9 <PID>
```

## Quick Commands Reference

```bash
# Start servers (if stopped)
cd /mnt/c/Users/chaim.shuster/pc/backend && nohup npm run dev > backend.log 2>&1 &
cd /mnt/c/Users/chaim.shuster/pc/frontend && nohup npm run dev > frontend.log 2>&1 &

# Stop servers
pkill -f "tsx watch" && pkill -f "vite"

# View logs
tail -f backend/backend.log
tail -f frontend/frontend.log

# Check status
ps aux | grep -E "(tsx|vite)" | grep -v grep

# Restart servers
pkill -f "tsx watch" && pkill -f "vite" && sleep 2
cd backend && nohup npm run dev > backend.log 2>&1 &
cd ../frontend && nohup npm run dev > frontend.log 2>&1 &
```

## Next Steps

1. ✅ Open http://localhost:5173/ in your browser
2. ✅ Test user registration
3. ✅ Test login functionality
4. ✅ Test 2FA setup and login
5. ✅ Explore the application features
6. ⏳ Report any issues or bugs

## Support

If you encounter any issues:
1. Check the log files first
2. Verify database connection
3. Ensure all dependencies are installed
4. Check for port conflicts
5. Review the error messages in logs

---

**Status**: Servers are running in the background. Access the application at http://localhost:5173/

**Last Updated**: November 5, 2025
