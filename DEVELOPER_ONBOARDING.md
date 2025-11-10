# Developer Onboarding Guide

Welcome to the Monday Clone project! This guide will help you get started with development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Redis** 7+ ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))
- **Docker** (optional, for containerized development) ([Download](https://www.docker.com/get-started))

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd monday-clone
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 3. Set Up Environment Variables

#### Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your local configuration:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=dev-secret-key-change-in-production
DATABASE_URL=postgresql://monday_user:monday_password@localhost:5432/monday_clone
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

#### Frontend Setup

```bash
cd frontend
# Frontend uses proxy configuration, no .env needed for basic setup
```

### 4. Set Up Database

#### Using Docker Compose (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be ready
docker-compose ps
```

#### Manual Setup

1. **Create PostgreSQL Database**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE monday_clone;
CREATE USER monday_user WITH PASSWORD 'monday_password';
GRANT ALL PRIVILEGES ON DATABASE monday_clone TO monday_user;
\q
```

2. **Start Redis**
```bash
# Linux/Mac
redis-server

# Windows (if installed)
redis-server
```

### 5. Run Database Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 6. Start Development Servers

#### Option 1: Run Both Servers Together

```bash
# From root directory
npm run dev
```

#### Option 2: Run Servers Separately

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

### 7. Verify Installation

1. **Backend Health Check**
   - Open: http://localhost:3001/health
   - Should return: `{"status":"ok","timestamp":"...","redis":"connected"}`

2. **Frontend Application**
   - Open: http://localhost:5173
   - Should show login page

3. **API Documentation**
   - Open: http://localhost:3001/api-docs
   - Should show Swagger UI

## Project Structure

```
monday-clone/
├── backend/              # Express.js backend API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── socket/        # WebSocket handlers
│   │   ├── config/       # Configuration files
│   │   └── utils/        # Utility functions
│   ├── prisma/           # Database schema and migrations
│   └── uploads/          # File uploads directory
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API services
│   │   ├── utils/        # Utility functions
│   │   └── views/        # View components (Table, Kanban, etc.)
│   └── public/           # Static assets
└── shared/               # Shared TypeScript types
```

## Development Workflow

### Making Changes

1. **Create a Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Your Changes**
   - Follow the coding standards (ESLint, Prettier)
   - Write meaningful commit messages
   - Test your changes locally

3. **Run Linters**
```bash
# Backend
cd backend
npm run lint
npm run format:check

# Frontend
cd frontend
npm run lint
npm run format:check
```

4. **Format Code**
```bash
# Backend
cd backend
npm run format

# Frontend
cd frontend
npm run format
```

5. **Commit Changes**
```bash
git add .
git commit -m "feat: add new feature"
```

### Database Changes

When modifying the database schema:

1. **Update Prisma Schema**
   - Edit `backend/prisma/schema.prisma`

2. **Create Migration**
```bash
cd backend
npm run prisma:migrate
# Enter migration name when prompted
```

3. **Generate Prisma Client**
```bash
npm run prisma:generate
```

### Testing

#### Run Tests (when implemented)
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

#### Manual Testing
- Use the Swagger UI at http://localhost:3001/api-docs
- Test in the browser at http://localhost:5173
- Check browser console for errors
- Check backend logs in terminal

## Common Tasks

### Reset Database

```bash
cd backend
npm run prisma:migrate reset
```

**Warning**: This will delete all data!

### View Database

```bash
cd backend
npm run prisma:studio
```

Opens Prisma Studio at http://localhost:5555

### Clear Redis Cache

```bash
redis-cli FLUSHALL
```

### Check Logs

**Backend logs**: Check terminal where backend is running

**Frontend logs**: Check browser console (F12)

**Database logs**: Check PostgreSQL logs

**Redis logs**: Check Redis logs

## Code Style

### TypeScript

- Use TypeScript strict mode (already enabled)
- Avoid `any` type
- Use interfaces for object types
- Export types/interfaces from `shared` package when reusable

### React

- Use functional components with hooks
- Use `React.memo` for expensive components
- Use `useMemo` and `useCallback` appropriately
- Follow component naming conventions (PascalCase)

### Naming Conventions

- **Files**: camelCase for utilities, PascalCase for components
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Components**: PascalCase
- **Types/Interfaces**: PascalCase

### File Organization

- Group related files together
- Use index files for clean imports
- Keep components small and focused
- Extract reusable logic into hooks/utilities

## Debugging

### Backend Debugging

1. **Use Logger Utility**
```typescript
import { logger } from '../utils/logger';

logger.log('Debug message');
logger.error('Error message', error);
```

2. **Check Server Logs**
   - All logs appear in the terminal
   - Errors are logged with stack traces

3. **Use Debugger**
   - Set breakpoints in VS Code
   - Use `debugger;` statement
   - Attach debugger to Node.js process

### Frontend Debugging

1. **Browser DevTools**
   - Open Chrome DevTools (F12)
   - Check Console for errors
   - Use Network tab for API calls
   - Use React DevTools extension

2. **React Error Boundary**
   - Errors are caught by ErrorBoundary
   - Check error details in UI

3. **Logger Utility**
```typescript
import { logger } from '../utils/logger';

logger.log('Debug message');
logger.error('Error message', error);
```

## API Development

### Adding New Endpoints

1. **Create Controller**
```typescript
// backend/src/controllers/myFeature.ts
export const myFeatureController = {
  async get(req: AuthRequest, res: Response) {
    // Implementation
  }
};
```

2. **Create Route**
```typescript
// backend/src/routes/myFeature.ts
import { Router } from 'express';
import { myFeatureController } from '../controllers/myFeature';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', myFeatureController.get);

export default router;
```

3. **Register Route**
```typescript
// backend/src/routes/index.ts
import myFeatureRoutes from './myFeature';
app.use('/api/my-feature', myFeatureRoutes);
```

4. **Add Swagger Documentation**
```typescript
/**
 * @swagger
 * /api/my-feature:
 *   get:
 *     summary: Get my feature data
 *     tags: [MyFeature]
 *     security:
 *       - bearerAuth: []
 */
```

## Frontend Development

### Adding New Components

1. **Create Component File**
```typescript
// frontend/src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
}

export default function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>;
}
```

2. **Add to Page/View**
```typescript
import MyComponent from '../components/MyComponent';

// Use component
<MyComponent title="Hello" />
```

### Adding New Pages

1. **Create Page Component**
```typescript
// frontend/src/pages/MyPage.tsx
import React from 'react';

export default function MyPage() {
  return <div>My Page</div>;
}
```

2. **Add Route**
```typescript
// frontend/src/routes/index.tsx
import MyPage from '../pages/MyPage';

<Route path="/my-page" element={<MyPage />} />
```

## Useful Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run prisma:studio # Open Prisma Studio
npm run prisma:migrate # Run database migrations
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
# Windows
netstat -ano | findstr :3001
# Linux/Mac
lsof -i :3001

# Kill process (replace PID)
# Windows
taskkill /PID <PID> /F
# Linux/Mac
kill -9 <PID>
```

### Database Connection Errors

- Verify PostgreSQL is running
- Check DATABASE_URL format
- Verify database exists
- Check user permissions

### Redis Connection Errors

- Verify Redis is running: `redis-cli ping`
- Check REDIS_URL format
- Verify network connectivity

### Module Not Found Errors

- Run `npm install` in the affected directory
- Check import paths
- Verify file exists

## Getting Help

- **Documentation**: Check `/docs` directory
- **API Docs**: http://localhost:3001/api-docs
- **Code Comments**: Read inline documentation
- **Team**: Contact team members via Slack/email

## Next Steps

1. Explore the codebase
2. Read component documentation
3. Check existing issues/PRs
4. Start with small tasks
5. Ask questions!

Happy coding! 🚀

