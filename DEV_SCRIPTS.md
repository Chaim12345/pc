# Development Scripts

This document describes useful development scripts available in the project.

## Root Scripts

### `npm run dev`
Start both backend and frontend development servers concurrently.

### `npm run dev:backend`
Start only the backend development server.

### `npm run dev:frontend`
Start only the frontend development server.

### `npm run build`
Build all packages (shared, backend, frontend) for production.

### `npm run lint`
Run ESLint on both frontend and backend.

### `npm run format`
Format code with Prettier in both frontend and backend.

### `npm run format:check`
Check code formatting without making changes.

### `npm run install:all`
Install dependencies for root, frontend, backend, and shared packages.

## Backend Scripts

Run from `backend/` directory:

### `npm run dev`
Start development server with hot reload (using tsx watch).

### `npm run build`
Compile TypeScript to JavaScript.

### `npm run start`
Start production server (requires build first).

### `npm run lint`
Run ESLint on TypeScript files.

### `npm run format`
Format code with Prettier.

### `npm run format:check`
Check code formatting.

### `npm run prisma:generate`
Generate Prisma Client.

### `npm run prisma:migrate`
Run database migrations.

### `npm run prisma:studio`
Open Prisma Studio (database GUI).

## Frontend Scripts

Run from `frontend/` directory:

### `npm run dev`
Start Vite development server.

### `npm run build`
Build for production.

### `npm run preview`
Preview production build locally.

### `npm run lint`
Run ESLint on TypeScript/React files.

### `npm run format`
Format code with Prettier.

### `npm run format:check`
Check code formatting.

### `npm run tauri:dev`
Start Tauri development (desktop app).

### `npm run tauri:build`
Build Tauri desktop application.

## Git Hooks (Husky)

### Pre-commit Hook
Automatically runs:
- ESLint on changed files
- Prettier format check

### Commit-msg Hook
Validates commit message format using Conventional Commits.

**Commit Message Format:**
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Tests
- `build`: Build system
- `ci`: CI/CD
- `chore`: Other changes

**Examples:**
```
feat(auth): add 2FA support
fix(boards): resolve drag and drop issue
docs(readme): update installation instructions
```

## VS Code Tasks

### Format Document
- Shortcut: `Shift + Alt + F` (Windows/Linux) or `Shift + Option + F` (Mac)
- Formats current file with Prettier

### Organize Imports
- Shortcut: `Shift + Alt + O` (Windows/Linux) or `Shift + Option + O` (Mac)
- Organizes imports automatically

## Docker Scripts

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart Services
```bash
docker-compose restart
```

## Database Scripts

### Reset Database
```bash
cd backend
npm run prisma:migrate reset
```

**Warning**: This deletes all data!

### Create Migration
```bash
cd backend
npm run prisma:migrate
# Enter migration name when prompted
```

### View Database
```bash
cd backend
npm run prisma:studio
```

Opens at http://localhost:5555

## Redis Scripts

### Clear Cache
```bash
redis-cli FLUSHALL
```

### Check Connection
```bash
redis-cli ping
```

Should return: `PONG`

## Testing Scripts (Future)

When testing is set up:

### `npm test`
Run all tests.

### `npm run test:watch`
Run tests in watch mode.

### `npm run test:coverage`
Generate test coverage report.

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Clear Node Modules
```bash
# Remove all node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Reinstall
npm run install:all
```

### Clear Build Artifacts
```bash
# Backend
cd backend && rm -rf dist

# Frontend
cd frontend && rm -rf dist node_modules/.vite
```

