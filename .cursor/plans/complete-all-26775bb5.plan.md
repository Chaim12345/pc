<!-- 26775bb5-529e-4b68-a69c-5d26603d1832 aaf62acc-3035-4824-9111-be5d4f2080b3 -->
# Complete All Missing Features Implementation Plan

## Overview

This plan implements all 10 missing/partial features from the report, prioritizing user-facing functionality. Will use TipTap for Workdocs, Fabric.js for Whiteboards, skip infrastructure features, and implement AI Assistant UI with placeholder API key.

## Phase 1: Quick Wins (Complete Partial Features)

### 1. Guest Access UI Integration (4-6 hours)

**Files to modify:**

- `frontend/src/pages/BoardView.tsx` - Add share button in board header
- Already has: `GuestAccessModal` component imported, `showGuestAccess` state

**Changes:**

- Add "Share" button next to board title (line ~200)
- Connect to existing `GuestAccessModal` component
- Test guest link generation and access tracking

### 2. Forms Testing & Polish (4-8 hours)

**Files to review/fix:**

- `frontend/src/pages/FormsPage.tsx`
- `frontend/src/pages/FormEditorPage.tsx`
- `frontend/src/pages/FormViewPage.tsx`

**Tasks:**

- Browser test form creation workflow
- Test public form submission
- Add form validation improvements
- Add basic form templates (Contact, Survey, Registration)

### 3. Activity Logs UI (8-10 hours)

**New files:**

- `frontend/src/pages/ActivityLogsPage.tsx`
- `frontend/src/components/ActivityFeed.tsx`

**Features:**

- Activity timeline with filters (user, action type, date)
- Search functionality
- Pagination for large logs
- Export to CSV button

**Backend already working** - just needs frontend display

## Phase 2: High-Value Features

### 4. AI Assistant UI (8-12 hours)

**New files:**

- `frontend/src/components/AIAssistantPanel.tsx`
- `frontend/src/services/ai.ts`

**Integration points in BoardView.tsx:**

- Already has: `AIAssistant` component imported, `showAIAssistant` state
- Add floating AI button in bottom-right corner
- Add "AI Suggestions" button in group headers

**Features:**

- Task generation from group context
- Board summarization
- Item name suggestions during creation
- Loading states and error handling
- Placeholder for OPENAI_API_KEY in .env.example

### 5. Recurring Tasks UI (8-12 hours)

**New files:**

- `frontend/src/components/RecurringTasksModal.tsx`
- `frontend/src/components/RecurringTaskForm.tsx`

**Backend changes:**

- `backend/src/server.ts` - Add node-cron scheduler
- Install `node-cron` package

**Features:**

- Create recurring task with frequency picker
- List existing recurring tasks
- Edit/delete recurring tasks
- Schedule visualization (next 5 runs)

### 6. Integrations Settings (12-16 hours)

**New files:**

- `frontend/src/pages/Settings/IntegrationsSettings.tsx`

**Backend changes:**

- Check if IntegrationConfig table migration exists, create if needed
- `backend/src/controllers/integrations.ts` - Add CRUD endpoints

**Features:**

- Slack webhook configuration UI
- Test connection button
- Event selection checkboxes (item created, status changed, etc.)
- Auto-trigger integrations from board events

## Phase 3: Core Feature Enhancements

### 7. Workdocs Rich Text Editor (16-20 hours)

**Files to modify:**

- `frontend/src/pages/WorkdocEditor.tsx` - Replace textarea with TipTap

**Install:**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-collaboration @tiptap/extension-placeholder
```

**Features:**

- Rich text toolbar (bold, italic, headings, lists, links)
- Auto-save every 30 seconds
- Real-time collaboration via WebSocket
- Export to PDF using html2pdf.js
- Basic version history (store snapshots on save)

### 8. Import/Export (24-32 hours)

**New files:**

- `backend/src/controllers/importExport.ts`
- `backend/src/routes/importExport.ts`
- `frontend/src/components/ExportModal.tsx`
- `frontend/src/components/ImportModal.tsx`

**Install backend:**

```bash
npm install exceljs csv-writer pdfkit
```

**Features:**

- Export board to Excel/CSV/PDF with column formatting
- Import from Excel/CSV with column mapping UI
- Download template for specific board
- Bulk import validation and error reporting

## Phase 4: Major New Features

### 9. Whiteboards (40-60 hours)

**Database schema:**

```prisma
model Whiteboard {
  id             String   @id @default(cuid())
  name           String
  content        Json
  organizationId String
  createdById    String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Backend:**

- `backend/src/controllers/whiteboards.ts` - Implement CRUD
- `backend/src/routes/whiteboards.ts` - Define routes
- Run migration: `npx prisma migrate dev --name add_whiteboards`

**Frontend:**

- `frontend/src/pages/WhiteboardsPage.tsx` - List page
- `frontend/src/pages/WhiteboardEditorPage.tsx` - Canvas editor

**Install:**

```bash
npm install fabric react-color
```

**Features:**

- Canvas with drawing tools (pen, shapes, text, sticky notes)
- Real-time collaboration via WebSocket
- Export to PNG/PDF
- Undo/redo functionality
- Object selection and manipulation

### 10. Documents System (20-30 hours)

**New database schema:**

```prisma
model Document {
  id             String   @id @default(cuid())
  name           String
  filepath       String
  mimeType       String
  size           Int
  folderId       String?
  organizationId String
  createdById    String
  version        Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  folder         Folder?  @relation(fields: [folderId], references: [id])
  versions       DocumentVersion[]
}

model Folder {
  id             String   @id @default(cuid())
  name           String
  parentId       String?
  organizationId String
  createdAt      DateTime @default(now())
  
  parent         Folder?  @relation("FolderHierarchy", fields: [parentId], references: [id])
  children       Folder[] @relation("FolderHierarchy")
  documents      Document[]
}

model DocumentVersion {
  id           String   @id @default(cuid())
  documentId   String
  version      Int
  filepath     String
  size         Int
  createdById  String
  createdAt    DateTime @default(now())
  
  document     Document @relation(fields: [documentId], references: [id])
}
```

**New files:**

- `backend/src/controllers/documents.ts`
- `backend/src/routes/documents.ts`
- `frontend/src/pages/DocumentsPage.tsx`
- `frontend/src/components/DocumentUploader.tsx`
- `frontend/src/components/FolderTree.tsx`

**Features:**

- Folder hierarchy with tree view
- File upload with drag-and-drop
- Version control (keep last 10 versions)
- File preview for common types
- Download and share documents
- Search within documents

## Implementation Order

1. **Week 1**: Guest Access, Forms, Activity Logs (Quick wins)
2. **Week 2**: AI Assistant, Recurring Tasks, Integrations (High value)
3. **Week 3**: Workdocs Rich Editor, Import/Export start
4. **Week 4**: Import/Export complete, Whiteboards start
5. **Week 5-6**: Whiteboards complete, Documents system

## Key Technical Details

**Dependencies to install:**

```bash
# Backend
cd backend
npm install node-cron exceljs csv-writer pdfkit

# Frontend
cd frontend
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-collaboration fabric react-color html2pdf.js
```

**Environment variables:**

```bash
# backend/.env.example
OPENAI_API_KEY=your_key_here_or_leave_blank
```

**Database migrations needed:**

- IntegrationConfig (check if exists)
- Whiteboard
- Document, Folder, DocumentVersion

## Testing Strategy

- Manual browser testing for each feature after implementation
- Test real-time features with multiple browser windows
- Test file uploads with various file types and sizes
- Test AI Assistant with and without API key

## Notes

- AI Assistant UI will work with placeholder, show appropriate error if no API key
- All new features follow existing architectural patterns
- Real-time features reuse existing Socket.io infrastructure
- All UI matches existing design system (Tailwind + dark mode support)

### To-dos

- [ ] Add Guest Access share button to BoardView header and test functionality
- [ ] Test forms workflow in browser and add basic templates
- [ ] Create ActivityLogsPage and ActivityFeed components with filtering
- [ ] Create AIAssistantPanel component and ai.ts service, integrate into BoardView
- [ ] Create RecurringTasksModal and add node-cron scheduler to server
- [ ] Create IntegrationsSettings page, add CRUD endpoints, implement auto-triggers
- [ ] Replace textarea with TipTap editor, add toolbar, auto-save, and export
- [ ] Create import/export controllers, modals, and implement Excel/CSV/PDF support
- [ ] Add database schema, implement backend CRUD, create canvas editor with Fabric.js
- [ ] Add database schema for folders/versions, implement file management with tree view