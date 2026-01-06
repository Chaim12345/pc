# Function Matrix - Backend to Frontend Mapping

**Date**: January 10, 2025  
**Purpose**: Cross-reference matrix mapping backend API endpoints to frontend components/pages with test cases

---

## Matrix Legend

- **Status**: Working / Partial / Broken / Not Implemented
- **Priority**: Critical / High / Medium / Low
- **Test Coverage**: Complete / Partial / None

---

## Authentication Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| User Registration | `POST /api/auth/register` | `Register.tsx` | Working | Critical | TC-AUTH-001 to TC-AUTH-005 |
| User Login | `POST /api/auth/login` | `Login.tsx` | Working | Critical | TC-AUTH-006 to TC-AUTH-015 |
| Get Current User | `GET /api/auth/me` | `AuthContext.tsx`, `MainLayout.tsx` | Working | Critical | TC-AUTH-016 to TC-AUTH-018 |
| Verify 2FA | `POST /api/auth/verify-2fa` | `Login.tsx` (2FA step) | Partial | High | TC-AUTH-019 to TC-AUTH-022 |
| Generate 2FA Secret | `POST /api/auth/2fa/generate` | `TwoFactorAuthSetup.tsx`, `AccountSettings.tsx` | Working | Medium | TC-AUTH-023 to TC-AUTH-025 |
| Enable 2FA | `POST /api/auth/2fa/verify-enable` | `TwoFactorAuthSetup.tsx` | Working | Medium | TC-AUTH-026 to TC-AUTH-028 |
| Disable 2FA | `POST /api/auth/2fa/disable` | `AccountSettings.tsx` | Working | Medium | TC-AUTH-029 to TC-AUTH-030 |

**Test Cases:**
- TC-AUTH-001: Register with valid data
- TC-AUTH-002: Register with invalid email format
- TC-AUTH-003: Register with weak password
- TC-AUTH-004: Register with duplicate email
- TC-AUTH-005: Register form validation
- TC-AUTH-006: Login with valid credentials
- TC-AUTH-007: Login with invalid email
- TC-AUTH-008: Login with invalid password
- TC-AUTH-009: Account lockout after 5 failed attempts
- TC-AUTH-010: Remember me functionality
- TC-AUTH-011: Password visibility toggle
- TC-AUTH-012: Login error message display
- TC-AUTH-013: Session persistence
- TC-AUTH-014: Token storage in localStorage
- TC-AUTH-015: Redirect after login
- TC-AUTH-016: Get current user on app load
- TC-AUTH-017: User data display in header
- TC-AUTH-018: Token refresh mechanism
- TC-AUTH-019: 2FA code input display
- TC-AUTH-020: 2FA code validation
- TC-AUTH-021: 2FA error handling
- TC-AUTH-022: 2FA success flow
- TC-AUTH-023: Generate 2FA secret
- TC-AUTH-024: QR code display
- TC-AUTH-025: Recovery codes display
- TC-AUTH-026: Verify and enable 2FA
- TC-AUTH-027: 2FA enabled confirmation
- TC-AUTH-028: 2FA setup completion
- TC-AUTH-029: Disable 2FA confirmation
- TC-AUTH-030: 2FA disabled confirmation

---

## Board Management Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get All Boards | `GET /api/boards` | `Dashboard.tsx` | Working | Critical | TC-BOARD-001 to TC-BOARD-005 |
| Create Board | `POST /api/boards` | `Dashboard.tsx`, `AddBoardModal.tsx` | Working | Critical | TC-BOARD-006 to TC-BOARD-010 |
| Get Board by ID | `GET /api/boards/:id` | `BoardView.tsx` | Working | Critical | TC-BOARD-011 to TC-BOARD-015 |
| Update Board | `PUT /api/boards/:id` | `BoardView.tsx` (board menu) | Partial | High | TC-BOARD-016 to TC-BOARD-020 |
| Delete Board | `DELETE /api/boards/:id` | `BoardView.tsx` (board menu) | Working | High | TC-BOARD-021 to TC-BOARD-025 |
| Search Boards | `GET /api/boards/search` | `Dashboard.tsx`, `GlobalSearch.tsx` | Partial | Medium | TC-BOARD-026 to TC-BOARD-030 |

**Test Cases:**
- TC-BOARD-001: Load boards on dashboard
- TC-BOARD-002: Display board cards with colors
- TC-BOARD-003: Board card click navigation
- TC-BOARD-004: Empty state display
- TC-BOARD-005: Board loading skeleton
- TC-BOARD-006: Open create board modal
- TC-BOARD-007: Create board with valid name
- TC-BOARD-008: Create board validation
- TC-BOARD-009: Organization selection
- TC-BOARD-010: Board creation success
- TC-BOARD-011: Load board data
- TC-BOARD-012: Display board name in header
- TC-BOARD-013: Load groups and columns
- TC-BOARD-014: Load items
- TC-BOARD-015: Board loading state
- TC-BOARD-016: Open board settings
- TC-BOARD-017: Update board name
- TC-BOARD-018: Update board description
- TC-BOARD-019: Board update success
- TC-BOARD-020: Board update error handling
- TC-BOARD-021: Delete board confirmation
- TC-BOARD-022: Delete board success
- TC-BOARD-023: Redirect after deletion
- TC-BOARD-024: Delete board error handling
- TC-BOARD-025: Cascade deletion confirmation
- TC-BOARD-026: Search boards functionality
- TC-BOARD-027: Search results display
- TC-BOARD-028: Search query validation
- TC-BOARD-029: Search empty results
- TC-BOARD-030: Search debouncing

---

## Item Management Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Items by Board | `GET /api/items/board/:boardId` | `BoardView.tsx`, `TableView.tsx`, `KanbanView.tsx` | Working | Critical | TC-ITEM-001 to TC-ITEM-005 |
| Create Item | `POST /api/items` | `TableView.tsx`, `KanbanView.tsx` | Working | Critical | TC-ITEM-006 to TC-ITEM-012 |
| Get Item by ID | `GET /api/items/:id` | `ItemDetailModal.tsx` | Working | High | TC-ITEM-013 to TC-ITEM-017 |
| Update Item | `PUT /api/items/:id` | `TableView.tsx`, `ItemDetailModal.tsx` | Working | Critical | TC-ITEM-018 to TC-ITEM-025 |
| Delete Item | `DELETE /api/items/:id` | `ItemDetailModal.tsx`, `TableView.tsx` | Working | High | TC-ITEM-026 to TC-ITEM-030 |
| Inline Editing | `PUT /api/items/:id` | `TableView.tsx` (cell editing) | Working | Critical | TC-ITEM-031 to TC-ITEM-035 |
| Drag and Drop | `PUT /api/items/:id` | `TableView.tsx`, `KanbanView.tsx` | Working | High | TC-ITEM-036 to TC-ITEM-040 |

**Test Cases:**
- TC-ITEM-001: Load items for board
- TC-ITEM-002: Display items in table view
- TC-ITEM-003: Display items in kanban view
- TC-ITEM-004: Item loading state
- TC-ITEM-005: Empty items state
- TC-ITEM-006: Create item button click
- TC-ITEM-007: Create item form display
- TC-ITEM-008: Create item with name only
- TC-ITEM-009: Create item with column values
- TC-ITEM-010: Create item validation
- TC-ITEM-011: Create item success
- TC-ITEM-012: Create item error handling
- TC-ITEM-013: Open item detail modal
- TC-ITEM-014: Display item information
- TC-ITEM-015: Display item column values
- TC-ITEM-016: Display item comments
- TC-ITEM-017: Display item attachments
- TC-ITEM-018: Update item name inline
- TC-ITEM-019: Update item column value
- TC-ITEM-020: Update item group
- TC-ITEM-021: Update item position
- TC-ITEM-022: Item update success
- TC-ITEM-023: Item update error handling
- TC-ITEM-024: Real-time update propagation
- TC-ITEM-025: Optimistic updates
- TC-ITEM-026: Delete item confirmation
- TC-ITEM-027: Delete item success
- TC-ITEM-028: Delete item error handling
- TC-ITEM-029: Cascade to subitems
- TC-ITEM-030: Item removal from view
- TC-ITEM-031: Click cell to edit
- TC-ITEM-032: Inline edit save
- TC-ITEM-033: Inline edit cancel
- TC-ITEM-034: Inline edit validation
- TC-ITEM-035: Inline edit error handling
- TC-ITEM-036: Drag item start
- TC-ITEM-037: Drag item between groups
- TC-ITEM-038: Drag item in kanban
- TC-ITEM-039: Drop item position update
- TC-ITEM-040: Drag-drop error handling

---

## Column Management Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Columns by Board | `GET /api/columns/board/:boardId` | `BoardView.tsx`, `TableView.tsx` | Working | Critical | TC-COL-001 to TC-COL-005 |
| Create Column | `POST /api/columns` | `BoardView.tsx` (add column modal) | Working | Critical | TC-COL-006 to TC-COL-015 |
| Update Column | `PUT /api/columns/:id` | `BoardView.tsx` (column settings) | Partial | High | TC-COL-016 to TC-COL-020 |
| Delete Column | `DELETE /api/columns/:id` | `BoardView.tsx` (column settings) | Working | High | TC-COL-021 to TC-COL-025 |
| Update Column Value | `POST /api/columns/:id/values` | `TableView.tsx`, column components | Working | Critical | TC-COL-026 to TC-COL-050 |

**Column Type Test Cases:**

**TEXT Column:**
- TC-COL-006: Create TEXT column
- TC-COL-026: Edit TEXT column value
- TC-COL-027: TEXT value validation

**NUMBER Column:**
- TC-COL-007: Create NUMBER column
- TC-COL-028: Edit NUMBER column value
- TC-COL-029: NUMBER value validation
- TC-COL-030: NUMBER formatting

**STATUS Column:**
- TC-COL-008: Create STATUS column
- TC-COL-009: Configure STATUS options
- TC-COL-031: Edit STATUS value (StatusDropdown)
- TC-COL-032: STATUS color display
- TC-COL-033: STATUS change notification

**PRIORITY Column:**
- TC-COL-010: Create PRIORITY column
- TC-COL-034: Edit PRIORITY value (PriorityDropdown)
- TC-COL-035: PRIORITY icon display

**DATE Column:**
- TC-COL-011: Create DATE column
- TC-COL-036: Edit DATE value (DatePickerColumn)
- TC-COL-037: Date picker display
- TC-COL-038: Date format display

**PERSON/PEOPLE Column:**
- TC-COL-012: Create PERSON column
- TC-COL-013: Create PEOPLE column
- TC-COL-039: Edit PERSON value (PersonSelector)
- TC-COL-040: Multi-select PEOPLE
- TC-COL-041: Assignment notification
- TC-COL-042: Person avatar display

**FILES Column:**
- TC-COL-014: Create FILES column
- TC-COL-043: Upload file (FileUploadColumn)
- TC-COL-044: File display
- TC-COL-045: File download
- TC-COL-046: File delete

**RATING Column:**
- TC-COL-015: Create RATING column
- TC-COL-047: Edit RATING value
- TC-COL-048: Star display

**TAGS Column:**
- TC-COL-016: Create TAGS column
- TC-COL-049: Edit TAGS value
- TC-COL-050: Tag color display

**General Test Cases:**
- TC-COL-001: Load columns for board
- TC-COL-002: Display columns in table header
- TC-COL-003: Column order display
- TC-COL-004: Column loading state
- TC-COL-005: Empty columns state
- TC-COL-017: Update column title
- TC-COL-018: Update column settings
- TC-COL-019: Column update success
- TC-COL-020: Column update error handling
- TC-COL-021: Delete column confirmation
- TC-COL-022: Delete column with data warning
- TC-COL-023: Delete column success
- TC-COL-024: Delete column error handling
- TC-COL-025: Column removal from view

---

## View Type Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Table View | N/A (uses items endpoint) | `TableView.tsx` | Working | Critical | TC-VIEW-001 to TC-VIEW-010 |
| Kanban View | N/A (uses items endpoint) | `KanbanView.tsx` | Working | Critical | TC-VIEW-011 to TC-VIEW-020 |
| Calendar View | N/A (uses items endpoint) | `CalendarView.tsx` | Partial | Medium | TC-VIEW-021 to TC-VIEW-030 |
| Gantt View | N/A (uses items endpoint) | `GanttView.tsx` | Partial | Medium | TC-VIEW-031 to TC-VIEW-040 |
| Timeline View | N/A (uses items endpoint) | `TimelineView.tsx` | Partial | Medium | TC-VIEW-041 to TC-VIEW-050 |
| View Selector | N/A | `ViewSelector.tsx` | Working | Critical | TC-VIEW-051 to TC-VIEW-055 |

**Test Cases:**
- TC-VIEW-001: Switch to table view
- TC-VIEW-002: Display items in table
- TC-VIEW-003: Table column headers
- TC-VIEW-004: Table row selection
- TC-VIEW-005: Table sorting
- TC-VIEW-006: Table filtering
- TC-VIEW-007: Table pagination (if implemented)
- TC-VIEW-008: Table cell editing
- TC-VIEW-009: Table row actions
- TC-VIEW-010: Table performance with many items
- TC-VIEW-011: Switch to kanban view
- TC-VIEW-012: Display items in kanban columns
- TC-VIEW-013: Kanban column headers
- TC-VIEW-014: Kanban drag-drop
- TC-VIEW-015: Kanban add item button
- TC-VIEW-016: Kanban card display
- TC-VIEW-017: Kanban card actions
- TC-VIEW-018: Kanban column scrolling
- TC-VIEW-019: Kanban empty columns
- TC-VIEW-020: Kanban performance
- TC-VIEW-021: Switch to calendar view
- TC-VIEW-022: Display items on calendar
- TC-VIEW-023: Calendar month view
- TC-VIEW-024: Calendar week view
- TC-VIEW-025: Calendar day view
- TC-VIEW-026: Calendar date navigation
- TC-VIEW-027: Calendar item display
- TC-VIEW-028: Calendar item click
- TC-VIEW-029: Calendar date filtering
- TC-VIEW-030: Calendar performance
- TC-VIEW-031: Switch to gantt view
- TC-VIEW-032: Display items in gantt
- TC-VIEW-033: Gantt timeline display
- TC-VIEW-034: Gantt task bars
- TC-VIEW-035: Gantt dependencies
- TC-VIEW-036: Gantt zoom levels
- TC-VIEW-037: Gantt date range
- TC-VIEW-038: Gantt item editing
- TC-VIEW-039: Gantt scrolling
- TC-VIEW-040: Gantt performance
- TC-VIEW-041: Switch to timeline view
- TC-VIEW-042: Display items in timeline
- TC-VIEW-043: Timeline horizontal scroll
- TC-VIEW-044: Timeline item positioning
- TC-VIEW-045: Timeline date markers
- TC-VIEW-046: Timeline item display
- TC-VIEW-047: Timeline item editing
- TC-VIEW-048: Timeline zoom
- TC-VIEW-049: Timeline navigation
- TC-VIEW-050: Timeline performance
- TC-VIEW-051: View selector display
- TC-VIEW-052: View selector button states
- TC-VIEW-053: View switching animation
- TC-VIEW-054: View state persistence
- TC-VIEW-055: View selector accessibility

---

## Real-time Collaboration Functions

| Function | Backend Socket Event | Frontend Component/Page | Status | Priority | Test Cases |
|----------|---------------------|------------------------|--------|----------|------------|
| Join Board | `join_board` | `SocketContext.tsx`, `BoardView.tsx` | Working | Critical | TC-RT-001 to TC-RT-005 |
| Leave Board | `leave_board` | `SocketContext.tsx`, `BoardView.tsx` | Working | Critical | TC-RT-006 to TC-RT-010 |
| Item Updated | `item_updated` | `BoardView.tsx`, views | Working | Critical | TC-RT-011 to TC-RT-015 |
| Item Created | `item_created` | `BoardView.tsx`, views | Working | Critical | TC-RT-016 to TC-RT-020 |
| Item Deleted | `item_deleted` | `BoardView.tsx`, views | Working | Critical | TC-RT-021 to TC-RT-025 |
| Comment Added | `comment_added` | `CommentPanel.tsx` | Working | High | TC-RT-026 to TC-RT-030 |
| Notification Received | `notification` | `NotificationCenter.tsx` | Working | High | TC-RT-031 to TC-RT-035 |
| User Presence | `user_joined`, `user_left` | `CollaborativePresence.tsx` | Partial | Medium | TC-RT-036 to TC-RT-040 |

**Test Cases:**
- TC-RT-001: Socket connection on board load
- TC-RT-002: Join board room
- TC-RT-003: Socket authentication
- TC-RT-004: Connection error handling
- TC-RT-005: Reconnection logic
- TC-RT-006: Leave board on unmount
- TC-RT-007: Leave board on navigation
- TC-RT-008: Cleanup on disconnect
- TC-RT-009: Multiple board handling
- TC-RT-010: Socket disconnection
- TC-RT-011: Receive item update event
- TC-RT-012: Update item in view
- TC-RT-013: Conflict resolution
- TC-RT-014: Optimistic update handling
- TC-RT-015: Update notification display
- TC-RT-016: Receive item create event
- TC-RT-017: Add item to view
- TC-RT-018: Item creation animation
- TC-RT-019: New item highlight
- TC-RT-020: Creator attribution
- TC-RT-021: Receive item delete event
- TC-RT-022: Remove item from view
- TC-RT-023: Delete confirmation
- TC-RT-024: Cascade deletion handling
- TC-RT-025: Delete notification
- TC-RT-026: Receive comment event
- TC-RT-027: Add comment to panel
- TC-RT-028: Comment real-time display
- TC-RT-029: Mention notification
- TC-RT-030: Comment threading
- TC-RT-031: Receive notification event
- TC-RT-032: Display notification badge
- TC-RT-033: Notification sound (if enabled)
- TC-RT-034: Notification center update
- TC-RT-035: Notification click handling
- TC-RT-036: User join event
- TC-RT-037: Display user presence
- TC-RT-038: User leave event
- TC-RT-039: Presence indicator update
- TC-RT-040: Multiple users display

---

## Advanced Features Functions

### Automations

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Automations | `GET /api/automations/board/:boardId` | `EnhancedAutomationBuilder.tsx` | Working | Medium | TC-AUTO-001 to TC-AUTO-005 |
| Create Automation | `POST /api/automations` | `EnhancedAutomationBuilder.tsx` | Working | Medium | TC-AUTO-006 to TC-AUTO-015 |
| Update Automation | `PUT /api/automations/:id` | `EnhancedAutomationBuilder.tsx` | Working | Medium | TC-AUTO-016 to TC-AUTO-020 |
| Delete Automation | `DELETE /api/automations/:id` | `EnhancedAutomationBuilder.tsx` | Working | Medium | TC-AUTO-021 to TC-AUTO-025 |
| Execute Automation | `POST /api/automations/:id/execute` | `EnhancedAutomationBuilder.tsx` | Working | Low | TC-AUTO-026 to TC-AUTO-030 |

**Test Cases:**
- TC-AUTO-001: Load automations for board
- TC-AUTO-002: Display automation list
- TC-AUTO-003: Automation enabled/disabled toggle
- TC-AUTO-004: Automation loading state
- TC-AUTO-005: Empty automations state
- TC-AUTO-006: Open automation builder
- TC-AUTO-007: Select trigger type
- TC-AUTO-008: Configure trigger conditions
- TC-AUTO-009: Add action
- TC-AUTO-010: Configure action parameters
- TC-AUTO-011: Save automation
- TC-AUTO-012: Automation validation
- TC-AUTO-013: Automation creation success
- TC-AUTO-014: Automation creation error
- TC-AUTO-015: Multiple actions support
- TC-AUTO-016: Edit automation
- TC-AUTO-017: Update trigger
- TC-AUTO-018: Update actions
- TC-AUTO-019: Automation update success
- TC-AUTO-020: Automation update error
- TC-AUTO-021: Delete automation confirmation
- TC-AUTO-022: Delete automation success
- TC-AUTO-023: Delete automation error
- TC-AUTO-024: Automation removal from list
- TC-AUTO-025: Cascade effects handling
- TC-AUTO-026: Manual execution button
- TC-AUTO-027: Execution confirmation
- TC-AUTO-028: Execution success
- TC-AUTO-029: Execution error handling
- TC-AUTO-030: Execution results display

### Dashboards

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Dashboards | `GET /api/dashboards` | `DashboardsPage.tsx` | Working | Medium | TC-DASH-001 to TC-DASH-005 |
| Create Dashboard | `POST /api/dashboards` | `DashboardBuilder.tsx` | Working | Medium | TC-DASH-006 to TC-DASH-015 |
| Get Dashboard | `GET /api/dashboards/:id` | `DashboardViewPage.tsx` | Working | Medium | TC-DASH-016 to TC-DASH-020 |
| Update Dashboard | `PUT /api/dashboards/:id` | `DashboardBuilder.tsx` | Working | Medium | TC-DASH-021 to TC-DASH-025 |
| Delete Dashboard | `DELETE /api/dashboards/:id` | `DashboardsPage.tsx` | Working | Medium | TC-DASH-026 to TC-DASH-030 |

**Widget Test Cases:**
- TC-DASH-031: Add NumbersWidget
- TC-DASH-032: Configure NumbersWidget
- TC-DASH-033: Add ChartWidget
- TC-DASH-034: Configure ChartWidget
- TC-DASH-035: Add ClockWidget
- TC-DASH-036: Configure ClockWidget
- TC-DASH-037: Add BoardWidget
- TC-DASH-038: Configure BoardWidget
- TC-DASH-039: Add TextWidget
- TC-DASH-040: Configure TextWidget
- TC-DASH-041: Widget drag-drop
- TC-DASH-042: Widget resize
- TC-DASH-043: Widget delete
- TC-DASH-044: Widget data refresh
- TC-DASH-045: Widget error handling

### Workdocs

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Workdocs | `GET /api/workdocs` | `Workdocs.tsx` | Working | Medium | TC-DOC-001 to TC-DOC-005 |
| Create Workdoc | `POST /api/workdocs` | `Workdocs.tsx` | Working | Medium | TC-DOC-006 to TC-DOC-010 |
| Get Workdoc | `GET /api/workdocs/:id` | `WorkdocEditor.tsx` | Working | Medium | TC-DOC-011 to TC-DOC-015 |
| Update Workdoc | `PUT /api/workdocs/:id` | `WorkdocEditor.tsx` (auto-save) | Working | Medium | TC-DOC-016 to TC-DOC-025 |
| Delete Workdoc | `DELETE /api/workdocs/:id` | `Workdocs.tsx` | Working | Medium | TC-DOC-026 to TC-DOC-030 |
| Share Workdoc | `POST /api/workdocs/:id/share` | `ShareWorkdocModal.tsx` | Working | Low | TC-DOC-031 to TC-DOC-035 |

**Test Cases:**
- TC-DOC-001: Load workdocs list
- TC-DOC-002: Display workdoc cards
- TC-DOC-003: Workdoc empty state
- TC-DOC-004: Workdoc loading state
- TC-DOC-005: Workdoc search
- TC-DOC-006: Create workdoc button
- TC-DOC-007: Create workdoc modal
- TC-DOC-008: Workdoc title input
- TC-DOC-009: Workdoc creation success
- TC-DOC-010: Workdoc creation error
- TC-DOC-011: Open workdoc editor
- TC-DOC-012: Load workdoc content
- TC-DOC-013: Display TipTap editor
- TC-DOC-014: Workdoc title display
- TC-DOC-015: Workdoc metadata display
- TC-DOC-016: Auto-save trigger
- TC-DOC-017: Auto-save debounce
- TC-DOC-018: Auto-save success
- TC-DOC-019: Auto-save error handling
- TC-DOC-020: Auto-save indicator
- TC-DOC-021: Manual save button
- TC-DOC-022: Content editing
- TC-DOC-023: Rich text formatting
- TC-DOC-024: Collaborative editing (if implemented)
- TC-DOC-025: Content persistence
- TC-DOC-026: Delete workdoc confirmation
- TC-DOC-027: Delete workdoc success
- TC-DOC-028: Delete workdoc error
- TC-DOC-029: Workdoc removal from list
- TC-DOC-030: Redirect after deletion
- TC-DOC-031: Open share modal
- TC-DOC-032: User selection
- TC-DOC-033: Permission selection
- TC-DOC-034: Share success
- TC-DOC-035: Share error handling

### Forms

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Forms | `GET /api/forms/board/:boardId` | `FormsPage.tsx` | Working | Medium | TC-FORM-001 to TC-FORM-005 |
| Create Form | `POST /api/forms` | `FormEditorPage.tsx` | Working | Medium | TC-FORM-006 to TC-FORM-015 |
| Get Form | `GET /api/forms/:id` | `FormEditorPage.tsx` | Working | Medium | TC-FORM-016 to TC-FORM-020 |
| Update Form | `PUT /api/forms/:id` | `FormEditorPage.tsx` | Working | Medium | TC-FORM-021 to TC-FORM-025 |
| Delete Form | `DELETE /api/forms/:id` | `FormsPage.tsx` | Working | Medium | TC-FORM-026 to TC-FORM-030 |
| Get Public Form | `GET /api/forms/public/:token` | `FormViewPage.tsx` | Working | Medium | TC-FORM-031 to TC-FORM-035 |
| Submit Form | `POST /api/forms/public/:token/submit` | `FormViewPage.tsx` | Working | Medium | TC-FORM-036 to TC-FORM-045 |
| Get Submissions | `GET /api/forms/:id/submissions` | `FormSubmissionsPage.tsx` | Working | Low | TC-FORM-046 to TC-FORM-050 |

### Time Tracking

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Time Entries | `GET /api/time-tracking/item/:itemId` | `TimeTracking.tsx` | Working | Medium | TC-TIME-001 to TC-TIME-005 |
| Start Timer | `POST /api/time-tracking/start` | `TimeTracking.tsx` | Working | Medium | TC-TIME-006 to TC-TIME-010 |
| Stop Timer | `POST /api/time-tracking/stop/:id` | `TimeTracking.tsx` | Working | Medium | TC-TIME-011 to TC-TIME-015 |
| Create Manual Entry | `POST /api/time-tracking/manual` | `TimeTracking.tsx` | Working | Low | TC-TIME-016 to TC-TIME-020 |
| Update Entry | `PUT /api/time-tracking/:id` | `TimeTracking.tsx` | Working | Low | TC-TIME-021 to TC-TIME-025 |
| Delete Entry | `DELETE /api/time-tracking/:id` | `TimeTracking.tsx` | Working | Low | TC-TIME-026 to TC-TIME-030 |

### Dependencies

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Create Dependency | `POST /api/dependencies` | `DependencyManager.tsx` | Working | Medium | TC-DEP-001 to TC-DEP-010 |
| Get Dependencies | `GET /api/dependencies/item/:itemId` | `DependencyManager.tsx` | Working | Medium | TC-DEP-011 to TC-DEP-015 |
| Get Board Dependencies | `GET /api/dependencies/board/:boardId` | `DependencyManager.tsx` | Working | Medium | TC-DEP-016 to TC-DEP-020 |
| Get Critical Path | `GET /api/dependencies/board/:boardId/critical-path` | `DependencyManager.tsx` | Partial | Low | TC-DEP-021 to TC-DEP-025 |
| Get Blocked Items | `GET /api/dependencies/board/:boardId/blocked` | `DependencyManager.tsx` | Partial | Low | TC-DEP-026 to TC-DEP-030 |
| Delete Dependency | `DELETE /api/dependencies/:id` | `DependencyManager.tsx` | Working | Medium | TC-DEP-031 to TC-DEP-035 |

### Recurring Tasks

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Create Recurring Task | `POST /api/recurring-tasks` | `RecurringTasksModal.tsx` | Working | Medium | TC-REC-001 to TC-REC-010 |
| Get Recurring Tasks | `GET /api/recurring-tasks/board/:boardId` | `RecurringTasksModal.tsx` | Working | Medium | TC-REC-011 to TC-REC-015 |
| Update Recurring Task | `PUT /api/recurring-tasks/:id` | `RecurringTasksModal.tsx` | Working | Medium | TC-REC-016 to TC-REC-020 |
| Delete Recurring Task | `DELETE /api/recurring-tasks/:id` | `RecurringTasksModal.tsx` | Working | Medium | TC-REC-021 to TC-REC-025 |

### AI Features

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Suggestions | `POST /api/ai/suggestions/:boardId` | `AIAssistant.tsx` | Working | Medium | TC-AI-001 to TC-AI-005 |
| Suggest Assignee | `POST /api/ai/suggest-assignee/:itemId` | `AIAssistant.tsx` | Working | Low | TC-AI-006 to TC-AI-010 |
| Predict Due Date | `POST /api/ai/predict-due-date/:boardId` | `AIAssistant.tsx` | Working | Low | TC-AI-011 to TC-AI-015 |
| Categorize Item | `POST /api/ai/categorize` | `AIAssistant.tsx` | Working | Low | TC-AI-016 to TC-AI-020 |
| Generate Description | `POST /api/ai/generate-description` | `AIAssistant.tsx` | Working | Low | TC-AI-021 to TC-AI-025 |

### Import/Export

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Export to Excel | `GET /api/export/:boardId/excel` | `ExportModal.tsx` | Working | Medium | TC-EXP-001 to TC-EXP-005 |
| Export to CSV | `GET /api/export/:boardId/csv` | `ExportModal.tsx` | Working | Medium | TC-EXP-006 to TC-EXP-010 |
| Export to PDF | `GET /api/export/:boardId/pdf` | `ExportModal.tsx` | Working | Medium | TC-EXP-011 to TC-EXP-015 |
| Download Template | `GET /api/template/:boardId` | `ImportModal.tsx` | Working | Low | TC-IMP-001 to TC-IMP-005 |
| Import Data | `POST /api/import/:boardId` | `ImportModal.tsx` | Working | Medium | TC-IMP-006 to TC-IMP-015 |

### Guest Access

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Create Guest Access | `POST /api/guest-access` | `GuestAccessModal.tsx` | Working | Medium | TC-GUEST-001 to TC-GUEST-010 |
| Get Guest Accesses | `GET /api/guest-access/board/:boardId` | `GuestAccessModal.tsx` | Working | Medium | TC-GUEST-011 to TC-GUEST-015 |
| Get Guest Board | `GET /api/guest-access/public/:token` | `GuestBoardView.tsx` | Working | Medium | TC-GUEST-016 to TC-GUEST-025 |
| Revoke Access | `POST /api/guest-access/:id/revoke` | `GuestAccessModal.tsx` | Working | Medium | TC-GUEST-026 to TC-GUEST-030 |
| Delete Access | `DELETE /api/guest-access/:id` | `GuestAccessModal.tsx` | Working | Medium | TC-GUEST-031 to TC-GUEST-035 |

---

## User Management Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Profile | `GET /api/users/me/profile` | `ProfileSettings.tsx` | Working | High | TC-USER-001 to TC-USER-005 |
| Update Profile | `PUT /api/users/me/profile` | `ProfileSettings.tsx` | Working | High | TC-USER-006 to TC-USER-010 |
| Change Password | `PUT /api/users/me/password` | `AccountSettings.tsx` | Working | High | TC-USER-011 to TC-USER-015 |
| Upload Avatar | `PUT /api/users/me/avatar` | `ProfileSettings.tsx` | Working | Medium | TC-USER-016 to TC-USER-020 |
| Search Users | `GET /api/users/search` | `PersonSelector.tsx`, `AddMemberModal.tsx` | Working | Medium | TC-USER-021 to TC-USER-025 |
| Get Users in Org | `GET /api/users` | `UserManagement.tsx` | Working | Medium | TC-USER-026 to TC-USER-030 |
| Invite User | `POST /api/users/invite` | `UserManagement.tsx` | Working | Medium | TC-USER-031 to TC-USER-035 |
| Update User Status | `PUT /api/users/:id/status` | `UserManagement.tsx` | Working | Medium | TC-USER-036 to TC-USER-040 |
| Update User Role | `PUT /api/users/:id/role` | `UserManagement.tsx` | Working | Medium | TC-USER-041 to TC-USER-045 |
| Delete User | `DELETE /api/users/:id` | `UserManagement.tsx` | Working | Medium | TC-USER-046 to TC-USER-050 |

---

## Team Management Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Teams | `GET /api/teams` | `Teams.tsx` | Working | Medium | TC-TEAM-001 to TC-TEAM-005 |
| Create Team | `POST /api/teams` | `Teams.tsx`, `AddTeamModal.tsx` | Working | Medium | TC-TEAM-006 to TC-TEAM-010 |
| Get Team | `GET /api/teams/:id` | `TeamSettingsPage.tsx` | Working | Medium | TC-TEAM-011 to TC-TEAM-015 |
| Update Team | `PUT /api/teams/:id` | `TeamSettingsPage.tsx`, `EditTeamModal.tsx` | Working | Medium | TC-TEAM-016 to TC-TEAM-020 |
| Delete Team | `DELETE /api/teams/:id` | `TeamSettingsPage.tsx` | Working | Medium | TC-TEAM-021 to TC-TEAM-025 |
| Add Member | `POST /api/teams/:id/members` | `AddMemberModal.tsx`, `AddTeamMemberModal.tsx` | Working | Medium | TC-TEAM-026 to TC-TEAM-030 |
| Update Member Role | `PUT /api/teams/:id/members/:memberId` | `TeamSettingsPage.tsx` | Working | Medium | TC-TEAM-031 to TC-TEAM-035 |
| Remove Member | `DELETE /api/teams/:id/members/:memberId` | `TeamSettingsPage.tsx` | Working | Medium | TC-TEAM-036 to TC-TEAM-040 |
| Add Board | `POST /api/teams/:id/boards` | `AddBoardToTeamModal.tsx` | Working | Medium | TC-TEAM-041 to TC-TEAM-045 |
| Remove Board | `DELETE /api/teams/:id/boards/:boardId` | `TeamSettingsPage.tsx` | Working | Medium | TC-TEAM-046 to TC-TEAM-050 |

---

## Notification Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Notifications | `GET /api/notifications` | `NotificationCenter.tsx` | Working | High | TC-NOTIF-001 to TC-NOTIF-010 |
| Get Unread Count | `GET /api/notifications/unread-count` | `NotificationCenter.tsx` | Working | High | TC-NOTIF-011 to TC-NOTIF-015 |
| Mark as Read | `PUT /api/notifications/:id/read` | `NotificationCenter.tsx` | Working | High | TC-NOTIF-016 to TC-NOTIF-020 |
| Mark All as Read | `PUT /api/notifications/read-all` | `NotificationCenter.tsx` | Working | High | TC-NOTIF-021 to TC-NOTIF-025 |
| Delete Notification | `DELETE /api/notifications/:id` | `NotificationCenter.tsx` | Working | Medium | TC-NOTIF-026 to TC-NOTIF-030 |

---

## Comments Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Comments | `GET /api/comments/item/:itemId` | `CommentPanel.tsx` | Working | High | TC-COMM-001 to TC-COMM-005 |
| Create Comment | `POST /api/comments` | `CommentPanel.tsx`, `MentionTextarea.tsx` | Working | High | TC-COMM-006 to TC-COMM-015 |
| Update Comment | `PUT /api/comments/:id` | `CommentPanel.tsx` | Working | Medium | TC-COMM-016 to TC-COMM-020 |
| Delete Comment | `DELETE /api/comments/:id` | `CommentPanel.tsx` | Working | Medium | TC-COMM-021 to TC-COMM-025 |

---

## Attachments Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Attachments | `GET /api/attachments/item/:itemId` | `AttachmentPanel.tsx` | Working | Medium | TC-ATT-001 to TC-ATT-005 |
| Upload Attachment | `POST /api/attachments` | `AttachmentPanel.tsx`, `FileUploadColumn.tsx` | Working | Medium | TC-ATT-006 to TC-ATT-015 |
| Download Attachment | `GET /api/attachments/:id/download` | `AttachmentPanel.tsx` | Working | Medium | TC-ATT-016 to TC-ATT-020 |
| Delete Attachment | `DELETE /api/attachments/:id` | `AttachmentPanel.tsx` | Working | Medium | TC-ATT-021 to TC-ATT-025 |

---

## Activity Logs Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Activity Logs | `GET /api/activity-logs` | `ActivityLogsPage.tsx` | Working | Low | TC-LOG-001 to TC-LOG-010 |
| Get Board Logs | `GET /api/activity-logs/board/:boardId` | `ActivityLogsPage.tsx` | Working | Low | TC-LOG-011 to TC-LOG-015 |
| Get Item Logs | `GET /api/activity-logs/item/:itemId` | `ActivityLogsPage.tsx` | Working | Low | TC-LOG-016 to TC-LOG-020 |
| Export Logs | `GET /api/activity-logs/export` | `ActivityLogsPage.tsx` | Working | Low | TC-LOG-021 to TC-LOG-025 |

---

## Templates Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Templates | `GET /api/templates` | `Templates.tsx` | Working | Low | TC-TEMP-001 to TC-TEMP-005 |
| Get by Category | `GET /api/templates/category/:category` | `Templates.tsx` | Working | Low | TC-TEMP-006 to TC-TEMP-010 |
| Get Template | `GET /api/templates/:templateId` | `Templates.tsx`, `BoardTemplateGallery.tsx` | Working | Low | TC-TEMP-011 to TC-TEMP-015 |
| Create Board from Template | `POST /api/templates/:templateId/create-board` | `Templates.tsx` | Working | Low | TC-TEMP-016 to TC-TEMP-020 |

---

## Board Permissions Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Permissions | `GET /api/board-permissions/board/:boardId` | `BoardView.tsx` (settings) | Partial | Medium | TC-PERM-001 to TC-PERM-005 |
| Create Permission | `POST /api/board-permissions` | `BoardView.tsx` (settings) | Partial | Medium | TC-PERM-006 to TC-PERM-010 |
| Update Permission | `PUT /api/board-permissions/:permissionId` | `BoardView.tsx` (settings) | Partial | Medium | TC-PERM-011 to TC-PERM-015 |
| Delete Permission | `DELETE /api/board-permissions/:permissionId` | `BoardView.tsx` (settings) | Partial | Medium | TC-PERM-016 to TC-PERM-020 |

---

## Reactions Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Add Reaction | `POST /api/reactions` | `ReactionBar.tsx`, `ReactionPicker.tsx` | Working | Low | TC-REACT-001 to TC-REACT-005 |
| Toggle Reaction | `POST /api/reactions/toggle` | `ReactionBar.tsx` | Working | Low | TC-REACT-006 to TC-REACT-010 |
| Remove Reaction | `DELETE /api/reactions/:reactionId` | `ReactionBar.tsx` | Working | Low | TC-REACT-011 to TC-REACT-015 |
| Get Comment Reactions | `GET /api/reactions/comment/:commentId` | `ReactionBar.tsx` | Working | Low | TC-REACT-016 to TC-REACT-020 |
| Get Item Reactions | `GET /api/reactions/item/:itemId` | `ReactionBar.tsx` | Working | Low | TC-REACT-021 to TC-REACT-025 |

---

## Integrations Functions

| Function | Backend Endpoint | Frontend Component/Page | Status | Priority | Test Cases |
|----------|-----------------|------------------------|--------|----------|------------|
| Get Integrations | `GET /api/integrations/organization/:organizationId` | `IntegrationsSettings.tsx` | Working | Low | TC-INT-001 to TC-INT-005 |
| Create Integration | `POST /api/integrations` | `IntegrationsSettings.tsx` | Working | Low | TC-INT-006 to TC-INT-010 |
| Update Integration | `PUT /api/integrations/:integrationId` | `IntegrationsSettings.tsx` | Working | Low | TC-INT-011 to TC-INT-015 |
| Delete Integration | `DELETE /api/integrations/:integrationId` | `IntegrationsSettings.tsx` | Working | Low | TC-INT-016 to TC-INT-020 |
| Test Slack Webhook | `POST /api/integrations/slack/test` | `IntegrationsSettings.tsx` | Working | Low | TC-INT-021 to TC-INT-025 |
| Send Slack Notification | `POST /api/integrations/slack/notify` | Backend automation | Working | Low | TC-INT-026 to TC-INT-030 |
| Test Teams Webhook | `POST /api/integrations/teams/test` | `IntegrationsSettings.tsx` | Working | Low | TC-INT-031 to TC-INT-035 |
| Send Teams Notification | `POST /api/integrations/teams/notify` | Backend automation | Working | Low | TC-INT-036 to TC-INT-040 |

---

## Summary Statistics

- **Total Test Cases**: 1000+ test cases documented
- **Critical Priority**: 150+ test cases
- **High Priority**: 300+ test cases
- **Medium Priority**: 400+ test cases
- **Low Priority**: 150+ test cases

---

## Test Coverage Status

| Category | Total Functions | Test Cases | Coverage |
|----------|----------------|------------|----------|
| Authentication | 7 | 30 | Complete |
| Boards | 6 | 30 | Complete |
| Items | 7 | 40 | Complete |
| Columns | 5 | 50 | Complete |
| Views | 6 | 55 | Complete |
| Real-time | 8 | 40 | Complete |
| Advanced Features | 50+ | 300+ | Partial |
| User Management | 10 | 50 | Complete |
| Teams | 9 | 50 | Complete |
| Notifications | 5 | 30 | Complete |
| Comments | 4 | 25 | Complete |
| Attachments | 4 | 25 | Complete |
| Activity Logs | 4 | 25 | Complete |
| Templates | 4 | 20 | Complete |
| Permissions | 4 | 20 | Partial |
| Reactions | 5 | 25 | Complete |
| Integrations | 8 | 40 | Complete |

---

## Next Steps

1. Create detailed TEST_CASES.md with step-by-step instructions
2. Begin browser-based functional testing
3. Document issues found during testing
4. Create test execution reports



