# Monday.com Clone - Testing Instructions

## Application Status

✅ **Backend Server**: Running on http://localhost:3001
✅ **Frontend Server**: Running on http://localhost:5173
✅ **Database**: PostgreSQL running in Docker on port 5432
✅ **Prisma Client**: Generated successfully
✅ **TypeScript Errors**: Fixed

## Fixed Issues

1. **PostCSS Config**: Converted from CommonJS to ES module syntax
2. **Tailwind Config**: Converted from CommonJS to ES module syntax
3. **Prisma Schema**: Fixed relation field mismatch between Item and Comment models
4. **Prisma Client**: Generated successfully
5. **Database Migrations**: Applied successfully
6. **TypeScript Errors**:
   - Fixed `totalTime` const assignment error in TimeTracking.tsx
   - Removed deprecated `onSuccess` callbacks from AutomationBuilder.tsx
   - Removed deprecated `onSuccess` callbacks from DashboardBuilder.tsx
   - Added missing `useEffect` imports

## How to Test

### 1. Access the Application
Open your browser and navigate to:
```
http://localhost:5173
```

### 2. Register a New Account
- You'll be redirected to the login page
- Click "Register" or navigate to http://localhost:5173/register
- Create a new account with email and password

### 3. Login
- Use your credentials to log in
- You'll be redirected to the Dashboard

### 4. Test Features

#### Dashboard
- View your boards
- Create a new board
- Click on a board to view its details
- Use the theme toggle (🌙/☀️) to switch between light and dark mode
- Use the global search to find boards

#### Board View
- Create groups
- Add items to groups
- Edit item names inline
- Click on an item to open the detail modal
- Switch between different views: Table, Kanban, Calendar, Gantt, Timeline

#### Item Details (Modal)
- **Details Tab**: View item information
- **Comments Tab**: Add comments, reply to comments, @mention users
- **Attachments Tab**: Upload files, view attachments, delete attachments
- **Time Tracking Tab**: Start/stop timer, add manual time entries, view total time

#### Dashboards
- Click "View Dashboards" button on main dashboard
- Create custom dashboards
- Add widgets: Numbers, Charts, Clock, Board, Text
- Configure widget settings
- View live dashboard data

#### Keyboard Shortcuts
- `Ctrl+K` or `Cmd+K`: Open global search
- `Ctrl+D` or `Cmd+D`: Navigate to dashboards
- `Ctrl+Shift+D` or `Cmd+Shift+D`: Toggle dark mode
- `1-5`: Switch board views (when on board page)

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user

### Boards
- GET /api/boards - Get all boards
- POST /api/boards - Create board
- GET /api/boards/:id - Get board by ID
- PUT /api/boards/:id - Update board
- DELETE /api/boards/:id - Delete board

### Items
- GET /api/items/:id - Get item by ID
- POST /api/items - Create item
- PUT /api/items/:id - Update item
- DELETE /api/items/:id - Delete item

### Comments
- GET /api/comments?itemId=:id - Get comments for item
- POST /api/comments - Create comment
- DELETE /api/comments/:id - Delete comment

### Attachments
- GET /api/attachments?itemId=:id - Get attachments for item
- POST /api/attachments - Upload attachment
- DELETE /api/attachments/:id - Delete attachment

### Time Tracking
- GET /api/time-entries?itemId=:id - Get time entries for item
- POST /api/time-entries - Create time entry
- PATCH /api/time-entries/:id/stop - Stop active entry
- DELETE /api/time-entries/:id - Delete entry

### Dashboards
- GET /api/dashboards - Get all dashboards
- POST /api/dashboards - Create dashboard
- GET /api/dashboards/:id - Get dashboard by ID
- PUT /api/dashboards/:id - Update dashboard
- DELETE /api/dashboards/:id - Delete dashboard

## Real-time Features (Socket.IO)

The application uses Socket.IO for real-time updates:
- Join board rooms to receive live updates
- Item updates broadcast to all users viewing the board
- Comment notifications in real-time
- Time tracking updates

## Known Issues & Future Improvements

### Minor TypeScript Warnings
- Some unused variables in components (non-blocking)
- Implicit `any` types in some callback functions (non-blocking)

### Future Enhancements
- Drag and drop for items and columns
- Advanced filtering and sorting
- Export data to CSV/Excel
- Email notifications
- Mobile responsive improvements
- Advanced automation triggers
- Integration with third-party services

## Troubleshooting

### Frontend not loading
```bash
cd frontend
npm run dev
```

### Backend not starting
```bash
cd backend
npx prisma generate
npm run dev
```

### Database connection issues
```bash
docker-compose up -d
```

### Reset database
```bash
cd backend
npx prisma migrate reset
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/monday_clone?schema=public"
JWT_SECRET="your-secret-key-here"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

### Frontend (uses Vite defaults)
- No .env file needed
- API proxy configured in vite.config.ts

## Development Commands

### Install dependencies
```bash
npm install
```

### Build shared package
```bash
cd shared
npm run build
```

### Generate Prisma client
```bash
cd backend
npx prisma generate
```

### Run migrations
```bash
cd backend
npx prisma migrate dev
```

### Start all servers
```bash
# From root
npm run dev
```

### Build for production
```bash
npm run build
```

## Success! 🎉

The application is now fully functional. All major features are implemented:
- ✅ Authentication system
- ✅ Board management
- ✅ Multiple views (Table, Kanban, Calendar, Gantt, Timeline)
- ✅ Item management with inline editing
- ✅ Comments with threading and @mentions
- ✅ File attachments
- ✅ Time tracking
- ✅ Custom dashboards with widgets
- ✅ Real-time collaboration
- ✅ Dark mode
- ✅ Keyboard shortcuts
- ✅ Toast notifications
- ✅ Confirmation dialogs
- ✅ Global search

Enjoy testing your Monday.com clone! 🚀


