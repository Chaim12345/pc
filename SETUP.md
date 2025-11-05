# Monday.com Clone - Setup Guide

## Quick Start (Development)

### Prerequisites
- Node.js 18+ 
- PostgreSQL (or Docker)
- npm or yarn

### 1. Database Setup

**Option A: Docker (Recommended)**
```bash
docker-compose up -d
```

**Option B: Local PostgreSQL**
- Ensure PostgreSQL is running
- Create a database: `monday_clone_dev`

### 2. Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/monday_clone_dev"
JWT_SECRET="your-super-secret-jwt-key-change-this"
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

**Frontend** (`frontend/.env` or `frontend/.env.local`):
```env
VITE_API_URL="http://localhost:3001"
```

### 3. Install Dependencies

```bash
# Install shared types
cd shared
npm install

# Install backend
cd ../backend
npm install

# Install frontend  
cd ../frontend
npm install
```

### 4. Run Database Migrations

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

---

## First Time Setup

1. **Register a new account** at `/register`
2. **Login** with your credentials
3. An organization will be automatically created
4. **Create your first board** from the dashboard
5. Start adding items and exploring features!

---

## Available Features

### Board Views
- **Table View** - Spreadsheet-style with inline editing
- **Kanban View** - Drag-and-drop cards between status columns
- **Timeline View** - Gantt-chart style timeline
- **Calendar View** - Monthly calendar view

### Column Types
- Status, Text, Number, Date, People, Priority, Rating, Checkbox, Long Text, and more

### Collaboration
- Real-time updates via WebSocket
- Notifications with filtering
- Team management
- User mentions

### Settings
- Profile management with avatar upload
- Password changes
- Notification preferences
- Theme toggle (Dark/Light mode)

---

## Development Commands

### Backend
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npx prisma studio    # Open Prisma database GUI
npx prisma migrate dev # Create/run new migration
```

### Frontend
```bash
npm run dev          # Start dev server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `pg_isready` or `docker ps`
- Verify DATABASE_URL in `.env`
- Ensure database exists

### Port Already in Use
- Backend (3001): Change PORT in backend/.env
- Frontend (5173): Change in vite.config.ts or use `--port` flag

### Migration Errors
```bash
# Reset database (⚠️ DELETES ALL DATA)
cd backend
npx prisma migrate reset

# Or manually:
npx prisma migrate dev --create-only
# Edit migration file if needed
npx prisma migrate dev
```

### CORS Errors
- Ensure FRONTEND_URL in backend/.env matches your frontend URL
- Check browser console for specific errors

---

## Production Deployment

### Backend
1. Set NODE_ENV=production
2. Use production database URL
3. Set secure JWT_SECRET
4. Configure HTTPS
5. Set up file storage (S3/similar) for uploads
6. Configure email service (if needed)
7. Add monitoring (Sentry, Datadog)

### Frontend
1. Build: `npm run build`
2. Serve `dist/` folder via nginx/CDN
3. Configure API URL to production backend
4. Enable CDN for assets

### Database
1. Run migrations in production:
   ```bash
   npx prisma migrate deploy
   ```
2. Set up automated backups
3. Configure connection pooling

---

## Security Checklist for Production

- [ ] Change all default secrets
- [ ] Enable HTTPS
- [ ] Configure CSP headers
- [ ] Set up rate limiting (✅ Already implemented)
- [ ] Configure CORS properly (✅ Already implemented)
- [ ] Enable Helmet.js (✅ Already implemented)
- [ ] Set up monitoring & alerts
- [ ] Configure automated backups
- [ ] Review and harden permissions
- [ ] Add 2FA (optional)

---

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│    Frontend     │         │     Backend      │
│   (React+Vite)  │◄───────►│   (Express.js)   │
│                 │  REST   │                  │
│  - React Query  │  Socket │  - Prisma ORM    │
│  - Tailwind CSS │  .IO    │  - JWT Auth      │
│  - Socket.io    │         │  - Rate Limit    │
└─────────────────┘         └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │   PostgreSQL     │
                            │    Database      │
                            └──────────────────┘
```

---

## Key Technologies

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Query for server state
- React Router for routing
- Socket.IO client for real-time
- @dnd-kit for drag-and-drop

### Backend
- Express.js with TypeScript
- Prisma ORM
- PostgreSQL database
- Socket.IO for WebSockets
- JWT for authentication
- Helmet.js for security
- Express Rate Limit

---

## Need Help?

- Check QA_REPORT.md for detailed system analysis
- Review the codebase documentation
- Check browser/server console for errors
- Verify all environment variables are set

---

*Happy Building! 🚀*

