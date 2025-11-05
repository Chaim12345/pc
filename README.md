# Monday.com Clone

A full-featured clone of Monday.com with real-time collaboration, multiple views, automations, dashboards, and more.

## Features

- ✅ Visual boards with customizable columns
- ✅ Multiple views (Table, Kanban, Gantt, Timeline, Calendar)
- ✅ Real-time collaboration with WebSockets
- ✅ Comments and file attachments
- ✅ Automations and workflows
- ✅ Dashboards with widgets
- ✅ Time tracking
- ✅ Integrations and webhooks

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL (via Docker)

### Installation

1. Install dependencies:
```bash
npm run install:all
```

2. Start PostgreSQL database:
```bash
docker-compose up -d
```

3. Set up database:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

4. Start development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Project Structure

```
monday-clone/
├── frontend/          # React + TypeScript app
├── backend/           # Node.js + Express API
├── shared/            # Shared TypeScript types
└── docker-compose.yml # Local development setup
```

## Development

- Backend runs on port 3001
- Frontend runs on port 5173
- Database runs on port 5432

## License

MIT

