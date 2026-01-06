# Function Inventory - Monday Clone Application

**Date**: January 10, 2025  
**Status**: Complete Inventory  
**Total Backend Routes**: 29 modules  
**Total Frontend Pages**: 20+ pages  
**Total Components**: 50+ components

---

## Table of Contents

1. [Backend API Endpoints](#backend-api-endpoints)
2. [Frontend Pages](#frontend-pages)
3. [Frontend Components](#frontend-components)
4. [View Types](#view-types)
5. [Column Types](#column-types)
6. [Dashboard Widgets](#dashboard-widgets)

---

## Backend API Endpoints

### 1. Authentication (`/api/auth`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register a new user with name, email, password | No |
| `/api/auth/login` | POST | Login user with email and password, returns JWT token | No |
| `/api/auth/verify-2fa` | POST | Verify two-factor authentication code | No |
| `/api/auth/me` | GET | Get current authenticated user information | Yes |

**Features:**
- Password strength validation (min 8 chars, uppercase, lowercase, number, special char)
- Account lockout after 5 failed login attempts
- JWT token-based authentication
- Session management

---

### 2. Two-Factor Authentication (`/api/auth/2fa`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/2fa/generate` | POST | Generate 2FA secret and QR code | Yes |
| `/api/auth/2fa/verify-enable` | POST | Verify token and enable 2FA | Yes |
| `/api/auth/2fa/disable` | POST | Disable two-factor authentication | Yes |

**Features:**
- TOTP-based 2FA using otplib
- QR code generation for authenticator apps
- Recovery codes generation

---

### 3. Boards (`/api/boards`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/boards` | GET | Get all boards for current user | Yes |
| `/api/boards` | POST | Create a new board | Yes |
| `/api/boards/search` | GET | Search boards by query | Yes |
| `/api/boards/:id` | GET | Get board by ID with groups, columns, items | Yes |
| `/api/boards/:id` | PUT | Update board name and description | Yes |
| `/api/boards/:id` | DELETE | Delete board and cascade to items | Yes |

**Features:**
- Organization-based board access
- Board caching with Redis
- Real-time updates via Socket.io
- Board search functionality

---

### 4. Items (`/api/items`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/items/board/:boardId` | GET | Get all items for a board | Yes |
| `/api/items` | POST | Create a new item | Yes |
| `/api/items/:id` | GET | Get item by ID with column values | Yes |
| `/api/items/:id` | PUT | Update item (name, group, position, column values) | Yes |
| `/api/items/:id` | DELETE | Delete item and cascade to subitems | Yes |

**Features:**
- Item creation with column values
- Inline editing support
- Drag-and-drop position updates
- Subitems hierarchy support
- Automation triggers on create/update/delete

---

### 5. Columns (`/api/columns`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/columns/board/:boardId` | GET | Get all columns for a board | Yes |
| `/api/columns` | POST | Create a new column | Yes |
| `/api/columns/:id` | PUT | Update column (title, settings, options) | Yes |
| `/api/columns/:id` | DELETE | Delete column | Yes |
| `/api/columns/:id/values` | POST | Update column value for an item | Yes |

**Column Types Supported:**
- TEXT - Plain text input
- NUMBER - Numeric values
- STATUS - Dropdown with custom options
- PRIORITY - Priority levels
- DATE - Date picker
- PERSON/PEOPLE - User assignment
- FILES - File attachments
- RATING - Star rating
- TAGS - Multi-select tags

**Features:**
- Column value updates trigger notifications
- Assignment notifications for PEOPLE columns
- Status change notifications for STATUS columns
- Automation triggers on column value changes

---

### 6. Groups (`/api/groups`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/groups/board/:boardId` | GET | Get all groups for a board | Yes |
| `/api/groups` | POST | Create a new group | Yes |
| `/api/groups/:id` | PUT | Update group (name, position) | Yes |
| `/api/groups/:id` | DELETE | Delete group and cascade to items | Yes |

**Features:**
- Group reordering
- Items organized within groups
- Board structure management

---

### 7. Comments (`/api/comments`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/comments/item/:itemId` | GET | Get all comments for an item | Yes |
| `/api/comments` | POST | Create a new comment | Yes |
| `/api/comments/:id` | PUT | Update comment | Yes |
| `/api/comments/:id` | DELETE | Delete comment | Yes |

**Features:**
- @mentions support
- Reply threading
- Real-time comment updates
- Notification generation for mentions

---

### 8. Attachments (`/api/attachments`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/attachments/item/:itemId` | GET | Get all attachments for an item | Yes |
| `/api/attachments` | POST | Upload attachment (multipart/form-data) | Yes |
| `/api/attachments/:id/download` | GET | Download attachment file | Yes |
| `/api/attachments/:id` | DELETE | Delete attachment | Yes |

**Features:**
- File upload with validation (type, size)
- File storage management
- Download tracking

---

### 9. Automations (`/api/automations`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/automations/board/:boardId` | GET | Get all automations for a board | Yes |
| `/api/automations` | POST | Create a new automation | Yes |
| `/api/automations/:id` | GET | Get automation by ID | Yes |
| `/api/automations/:id` | PUT | Update automation | Yes |
| `/api/automations/:id` | DELETE | Delete automation | Yes |
| `/api/automations/:id/execute` | POST | Manually execute automation | Yes |

**Trigger Types:**
- ITEM_CREATED
- ITEM_UPDATED
- ITEM_DELETED
- STATUS_CHANGED
- ASSIGNEE_CHANGED

**Action Types:**
- UPDATE_COLUMN_VALUE
- CREATE_ITEM
- MOVE_TO_GROUP
- CHANGE_STATUS
- SEND_NOTIFICATION

---

### 10. Dashboards (`/api/dashboards`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/dashboards` | GET | Get all dashboards for user | Yes |
| `/api/dashboards` | POST | Create a new dashboard | Yes |
| `/api/dashboards/:id` | GET | Get dashboard by ID with widgets | Yes |
| `/api/dashboards/:id` | PUT | Update dashboard | Yes |
| `/api/dashboards/:id` | DELETE | Delete dashboard | Yes |

**Widget Types:**
- NumbersWidget - Display numeric metrics
- ChartWidget - Visualize data with charts
- ClockWidget - Time display
- BoardWidget - Embedded board view
- TextWidget - Rich text content

---

### 11. Time Tracking (`/api/time-tracking`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/time-tracking/item/:itemId` | GET | Get all time entries for an item | Yes |
| `/api/time-tracking/start` | POST | Start time tracking for an item | Yes |
| `/api/time-tracking/stop/:id` | POST | Stop active time entry | Yes |
| `/api/time-tracking/manual` | POST | Create manual time entry | Yes |
| `/api/time-tracking/:id` | PUT | Update time entry | Yes |
| `/api/time-tracking/:id` | DELETE | Delete time entry | Yes |

**Features:**
- Start/stop timer functionality
- Manual entry support
- Time reports per item

---

### 12. Notifications (`/api/notifications`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/notifications` | GET | Get all notifications for user (paginated) | Yes |
| `/api/notifications/unread-count` | GET | Get unread notification count | Yes |
| `/api/notifications/:id/read` | PUT | Mark notification as read | Yes |
| `/api/notifications/read-all` | PUT | Mark all notifications as read | Yes |
| `/api/notifications/:id` | DELETE | Delete notification | Yes |

**Notification Types:**
- Mention
- Comment
- Assignment
- Status change
- Automation
- System

**Features:**
- Real-time delivery via Socket.io
- Pagination support
- Read/unread status
- Bulk actions

---

### 13. Users (`/api/users`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/users/me/profile` | GET | Get current user profile | Yes |
| `/api/users/me/profile` | PUT | Update user profile (name, email) | Yes |
| `/api/users/me/password` | PUT | Change user password | Yes |
| `/api/users/me/avatar` | PUT | Upload user avatar (multipart/form-data) | Yes |
| `/api/users/search` | GET | Search users by query | Yes |
| `/api/users/all` | GET | Get all users (admin) | Yes |
| `/api/users` | GET | Get users in organization | Yes |
| `/api/users/invite` | POST | Invite user to organization | Yes |
| `/api/users/bulk` | POST | Bulk update users | Yes |
| `/api/users/:id` | GET | Get user by ID | Yes |
| `/api/users/:id/status` | PUT | Update user status (active/inactive) | Yes |
| `/api/users/:id/role` | PUT | Update user role | Yes |
| `/api/users/:id` | DELETE | Delete user | Yes |

**Features:**
- Avatar upload with validation
- User search functionality
- Role-based access control
- User invitation system
- Bulk operations

---

### 14. Teams (`/api/teams`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/teams` | GET | Get all teams in user's organization | Yes |
| `/api/teams` | POST | Create a new team | Yes |
| `/api/teams/:id` | GET | Get team by ID with members and boards | Yes |
| `/api/teams/:id` | PUT | Update team (name, description) | Yes |
| `/api/teams/:id` | DELETE | Delete team | Yes |
| `/api/teams/:id/members` | POST | Add member to team | Yes |
| `/api/teams/:id/members/:memberId` | PUT | Update member role | Yes |
| `/api/teams/:id/members/:memberId` | DELETE | Remove member from team | Yes |
| `/api/teams/:id/boards` | POST | Add board to team | Yes |
| `/api/teams/:id/boards/:boardId` | DELETE | Remove board from team | Yes |

**Features:**
- Team member management
- Board assignment to teams
- Role-based team permissions

---

### 15. Workdocs (`/api/workdocs`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/workdocs` | GET | Get all workdocs for user | Yes |
| `/api/workdocs` | POST | Create a new workdoc | Yes |
| `/api/workdocs/:id` | GET | Get workdoc by ID | Yes |
| `/api/workdocs/:id` | PUT | Update workdoc content (auto-save) | Yes |
| `/api/workdocs/:id` | DELETE | Delete workdoc | Yes |
| `/api/workdocs/:id/share` | POST | Share workdoc with users | Yes |
| `/api/workdocs/:id/share-link` | POST | Generate shareable link | Yes |
| `/api/workdocs/:id/shares` | GET | Get all shares for workdoc | Yes |
| `/api/workdocs/:id/shares/:shareId` | DELETE | Revoke share | Yes |

**Features:**
- Rich text editing (TipTap)
- Auto-save functionality
- Collaborative editing
- Sharing and permissions

---

### 16. AI Features (`/api/ai`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/ai/suggestions/:boardId` | POST | Get AI task suggestions for board | Yes |
| `/api/ai/suggest-assignee/:itemId` | POST | AI-suggested assignee for item | Yes |
| `/api/ai/predict-due-date/:boardId` | POST | Predict due date based on history | Yes |
| `/api/ai/categorize` | POST | Categorize item automatically | Yes |
| `/api/ai/generate-description` | POST | Generate item description | Yes |

**Features:**
- OpenAI GPT integration
- Task suggestion based on board context
- Smart assignee recommendation
- Due date prediction using historical data
- Automatic categorization

---

### 17. Forms (`/api/forms`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/forms/public/:token` | GET | Get public form by token | No |
| `/api/forms/public/:token/submit` | POST | Submit public form | No |
| `/api/forms/board/:boardId` | GET | Get all forms for a board | Yes |
| `/api/forms` | POST | Create a new form | Yes |
| `/api/forms/:id` | GET | Get form by ID | Yes |
| `/api/forms/:id` | PUT | Update form | Yes |
| `/api/forms/:id` | DELETE | Delete form | Yes |
| `/api/forms/:id/submissions` | GET | Get form submissions | Yes |
| `/api/forms/:id/analytics` | GET | Get form analytics | Yes |

**Features:**
- Public form access via token
- Form builder interface
- Submission tracking
- Analytics and reporting

---

### 18. Guest Access (`/api/guest-access`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/guest-access/public/:token` | GET | Get guest board access by token | No |
| `/api/guest-access` | POST | Create guest access | Yes |
| `/api/guest-access/board/:boardId` | GET | Get all guest accesses for board | Yes |
| `/api/guest-access/board/:boardId/analytics` | GET | Get guest access analytics | Yes |
| `/api/guest-access/:id` | PUT | Update guest access | Yes |
| `/api/guest-access/:id/revoke` | POST | Revoke guest access | Yes |
| `/api/guest-access/:id` | DELETE | Delete guest access | Yes |

**Features:**
- Token-based guest access
- Access level control (viewer/editor)
- Expiration dates
- Access tracking and analytics

---

### 19. Dependencies (`/api/dependencies`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/dependencies` | POST | Create dependency between items | Yes |
| `/api/dependencies/item/:itemId` | GET | Get dependencies for an item | Yes |
| `/api/dependencies/board/:boardId` | GET | Get all dependencies for a board | Yes |
| `/api/dependencies/board/:boardId/critical-path` | GET | Calculate critical path | Yes |
| `/api/dependencies/board/:boardId/blocked` | GET | Get blocked items | Yes |
| `/api/dependencies/:id` | DELETE | Delete dependency | Yes |

**Features:**
- Item dependency management
- Circular dependency detection
- Critical path calculation
- Blocked items identification

---

### 20. Recurring Tasks (`/api/recurring-tasks`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/recurring-tasks/run-due` | POST | Run due recurring tasks (cron) | No |
| `/api/recurring-tasks` | POST | Create recurring task | Yes |
| `/api/recurring-tasks/board/:boardId` | GET | Get recurring tasks for board | Yes |
| `/api/recurring-tasks/:id` | PUT | Update recurring task | Yes |
| `/api/recurring-tasks/:id` | DELETE | Delete recurring task | Yes |

**Features:**
- Task scheduling (daily, weekly, monthly)
- Automatic task creation
- Cron-based execution
- Flexible scheduling options

---

### 21. Activity Logs (`/api/activity-logs`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/activity-logs` | GET | Get all activity logs (filtered) | Yes |
| `/api/activity-logs/board/:boardId` | GET | Get activity logs for board | Yes |
| `/api/activity-logs/item/:itemId` | GET | Get activity logs for item | Yes |
| `/api/activity-logs/export` | GET | Export activity logs to CSV | Yes |

**Features:**
- Comprehensive activity tracking
- Filtering by user, action, date
- Export functionality
- Audit trail

---

### 22. Import/Export (`/api/export`, `/api/import`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/export/:boardId/excel` | GET | Export board to Excel | Yes |
| `/api/export/:boardId/csv` | GET | Export board to CSV | Yes |
| `/api/export/:boardId/pdf` | GET | Export board to PDF | Yes |
| `/api/template/:boardId` | GET | Download import template | Yes |
| `/api/import/:boardId` | POST | Import data from file | Yes |

**Features:**
- Multiple export formats
- Excel, CSV, PDF generation
- Import with validation
- Template download

---

### 23. Integrations (`/api/integrations`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/integrations/organization/:organizationId` | GET | Get integrations for organization | Yes |
| `/api/integrations/board/:boardId` | GET | Get integrations for board | Yes |
| `/api/integrations` | POST | Create integration | Yes |
| `/api/integrations/:integrationId` | PUT | Update integration | Yes |
| `/api/integrations/:integrationId` | DELETE | Delete integration | Yes |
| `/api/integrations/slack/test` | POST | Test Slack webhook | Yes |
| `/api/integrations/slack/notify` | POST | Send Slack notification | Yes |
| `/api/integrations/teams/test` | POST | Test Teams webhook | Yes |
| `/api/integrations/teams/notify` | POST | Send Teams notification | Yes |

**Features:**
- Slack integration
- Microsoft Teams integration
- Webhook configuration
- Notification testing

---

### 24. Reactions (`/api/reactions`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/reactions` | POST | Add reaction to comment/item | Yes |
| `/api/reactions/toggle` | POST | Toggle reaction | Yes |
| `/api/reactions/:reactionId` | DELETE | Remove reaction | Yes |
| `/api/reactions/comment/:commentId` | GET | Get reactions for comment | Yes |
| `/api/reactions/item/:itemId` | GET | Get reactions for item | Yes |

**Features:**
- Emoji reactions
- Comment and item reactions
- Toggle functionality

---

### 25. Templates (`/api/templates`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/templates` | GET | Get all board templates | Yes |
| `/api/templates/category/:category` | GET | Get templates by category | Yes |
| `/api/templates/:templateId` | GET | Get template by ID | Yes |
| `/api/templates/:templateId/create-board` | POST | Create board from template | Yes |

**Features:**
- Pre-built board templates
- Category-based filtering
- Template application

---

### 26. Board Permissions (`/api/board-permissions`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/board-permissions/board/:boardId` | GET | Get permissions for board | Yes |
| `/api/board-permissions` | POST | Create board permission | Yes |
| `/api/board-permissions/:permissionId` | PUT | Update permission | Yes |
| `/api/board-permissions/:permissionId` | DELETE | Delete permission | Yes |

**Features:**
- Team-based permissions
- Role-based access (owner, editor, viewer)
- Permission management

---

### 27. Organizations (`/api/organizations`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/organizations` | GET | Get all organizations for user | Yes |
| `/api/organizations` | POST | Create organization | Yes |
| `/api/organizations/:id` | GET | Get organization by ID | Yes |
| `/api/organizations/:id` | PUT | Update organization | Yes |
| `/api/organizations/:id` | DELETE | Delete organization | Yes |

**Features:**
- Multi-organization support
- Organization management
- Member management

---

### 28. Webhooks (`/api/webhooks`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/webhooks` | POST | Create webhook | Yes |
| `/api/webhooks/trigger` | POST | Trigger webhook manually | Yes |

**Features:**
- Webhook configuration
- Event-based triggers
- External integrations

---

### 29. Subitems (`/api/subitems`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| (Routes exist but implementation may vary) | | | |

**Features:**
- Hierarchical item structure
- Parent-child relationships
- Nested item management

---

## Frontend Pages

### 1. Authentication Pages

#### Login (`/login`)
- **File**: `frontend/src/pages/Login.tsx`
- **Features**:
  - Email/password login
  - "Remember me" checkbox
  - Password visibility toggle
  - Social login buttons (Google, Microsoft)
  - Forgot password link
  - Account lockout display
  - Error handling and validation

#### Register (`/register`)
- **File**: `frontend/src/pages/Register.tsx`
- **Features**:
  - User registration form
  - Password strength indicator
  - Email validation
  - Terms of service acceptance
  - Social sign-up options

---

### 2. Dashboard Pages

#### Main Dashboard (`/dashboard`)
- **File**: `frontend/src/pages/Dashboard.tsx`
- **Features**:
  - Board grid view
  - Recent boards display
  - Board creation
  - Quick access to boards
  - Color-coded board cards

#### Dashboards List (`/dashboards`)
- **File**: `frontend/src/pages/DashboardsPage.tsx`
- **Features**:
  - List of all dashboards
  - Dashboard creation
  - Dashboard management

#### Dashboard View (`/dashboards/:dashboardId`)
- **File**: `frontend/src/pages/DashboardViewPage.tsx`
- **Features**:
  - Dashboard display with widgets
  - Widget configuration
  - Dashboard editing

---

### 3. Board Pages

#### Board View (`/board/:boardId`)
- **File**: `frontend/src/pages/BoardView.tsx`
- **Features**:
  - Multiple view types (Table, Kanban, Calendar, Gantt, Timeline)
  - View selector
  - Column management
  - Item creation and editing
  - Filter and sort functionality
  - Export/Import modals
  - AI Assistant integration
  - Guest access sharing
  - Recurring tasks
  - Automations builder
  - Real-time collaboration
  - Keyboard shortcuts

#### Guest Board View (`/guest/board/:token`)
- **File**: `frontend/src/pages/GuestBoardView.tsx`
- **Features**:
  - Public board access via token
  - Limited functionality based on access level
  - Read-only or edit mode

---

### 4. Settings Pages (`/settings`)

#### Profile Settings (`/settings/profile`)
- **File**: `frontend/src/pages/Settings/ProfileSettings.tsx`
- **Features**:
  - Name and email editing
  - Avatar upload
  - Profile information display

#### Account Settings (`/settings/account`)
- **File**: `frontend/src/pages/Settings/AccountSettings.tsx`
- **Features**:
  - Password change
  - Two-factor authentication setup
  - Account deletion

#### Notification Settings (`/settings/notifications`)
- **File**: `frontend/src/pages/Settings/NotificationSettings.tsx`
- **Features**:
  - Email notification preferences
  - Push notification settings
  - In-app notification preferences
  - Notification type toggles

#### Preferences Settings (`/settings/preferences`)
- **File**: `frontend/src/pages/Settings/PreferencesSettings.tsx`
- **Features**:
  - Theme selection (light/dark)
  - Language selection
  - Timezone settings
  - Date/time format preferences

#### Integrations Settings (`/settings/integrations`)
- **File**: `frontend/src/pages/Settings/IntegrationsSettings.tsx`
- **Features**:
  - Slack integration setup
  - Microsoft Teams integration
  - Webhook configuration
  - Integration management

---

### 5. Team Pages

#### Teams List (`/teams`)
- **File**: `frontend/src/pages/Teams.tsx`
- **Features**:
  - List of all teams
  - Team creation
  - Team search and filtering

#### Team Settings (`/teams/:teamId`)
- **File**: `frontend/src/pages/TeamSettingsPage.tsx`
- **Features**:
  - Team details
  - Member management
  - Board assignment
  - Team settings

---

### 6. User Management (`/users`)
- **File**: `frontend/src/pages/UserManagement.tsx`
- **Features**:
  - User list with roles
  - User search
  - User invitation
  - Role management
  - User status management
  - Bulk operations

---

### 7. Workdocs Pages

#### Workdocs List (`/workdocs`)
- **File**: `frontend/src/pages/Workdocs.tsx`
- **Features**:
  - List of all workdocs
  - Workdoc creation
  - Workdoc search
  - Empty state

#### Workdoc Editor (`/workdocs/:workdocId`)
- **File**: `frontend/src/pages/WorkdocEditor.tsx`
- **Features**:
  - Rich text editor (TipTap)
  - Auto-save functionality
  - Title editing
  - Sharing options
  - Collaborative editing

---

### 8. Forms Pages

#### Forms List (`/forms/board/:boardId`)
- **File**: `frontend/src/pages/FormsPage.tsx`
- **Features**:
  - List of forms for a board
  - Form creation
  - Form management

#### Form Editor (`/forms/:formId`)
- **File**: `frontend/src/pages/FormEditorPage.tsx`
- **Features**:
  - Form builder interface
  - Field configuration
  - Form settings
  - Preview functionality

#### Form View (Public) (`/forms/view/:token`)
- **File**: `frontend/src/pages/FormViewPage.tsx`
- **Features**:
  - Public form display
  - Form submission
  - Field validation

#### Form Submissions (`/forms/:formId/submissions`)
- **File**: `frontend/src/pages/FormSubmissionsPage.tsx`
- **Features**:
  - Submission list
  - Submission details
  - Export functionality

---

### 9. Activity Logs (`/activity-logs`)
- **File**: `frontend/src/pages/ActivityLogsPage.tsx`
- **Features**:
  - Activity timeline
  - Filtering by user, action, date
  - Search functionality
  - Export to CSV

---

### 10. Templates (`/templates`)
- **File**: `frontend/src/pages/Templates.tsx`
- **Features**:
  - Template gallery
  - Category filtering
  - Template preview
  - Board creation from template

---

## Frontend Components

### Core Components

1. **MainLayout** - Main application layout with sidebar and header
2. **ViewSelector** - View type selector (Table, Kanban, Calendar, Gantt, Timeline)
3. **ErrorBoundary** - Error boundary for React error handling
4. **SkipLinks** - Accessibility skip links
5. **Modal** - Reusable modal component
6. **ConfirmationDialog** - Confirmation dialog component

### Board Components

7. **ItemRow** - Table view item row
8. **ItemDetailModal** - Item detail modal with tabs
9. **SubitemsPanel** - Subitems display and management
10. **CommentPanel** - Comments display and creation
11. **AttachmentPanel** - Attachments display and upload
12. **TimeTracking** - Time tracking component
13. **DependencyManager** - Dependency visualization and management

### Column Components

14. **StatusDropdown** - Status column dropdown
15. **PriorityDropdown** - Priority column dropdown
16. **DatePickerColumn** - Date column picker
17. **PersonSelector** - Person/People column selector
18. **FileUploadColumn** - File column upload
19. **BudgetColumn** - Budget column (custom)

### Feature Components

20. **AIAssistant** - AI assistant modal with features
21. **GuestAccessModal** - Guest access sharing modal
22. **RecurringTasksModal** - Recurring tasks management
23. **ExportModal** - Export options modal
24. **ImportModal** - Import data modal
25. **FilterModal** - Filter configuration modal
26. **SortModal** - Sort configuration modal
27. **EnhancedAutomationBuilder** - Automation builder interface

### Dashboard Components

28. **DashboardBuilder** - Dashboard creation and editing
29. **DashboardViewer** - Dashboard display
30. **widgets/NumbersWidget** - Numbers widget
31. **widgets/ChartWidget** - Chart widget
32. **widgets/ClockWidget** - Clock widget
33. **widgets/BoardWidget** - Board widget
34. **widgets/TextWidget** - Text widget

### Collaboration Components

35. **CollaborativePresence** - User presence indicators
36. **NotificationCenter** - Notification dropdown
37. **GlobalSearch** - Global search functionality
38. **KeyboardShortcutsPanel** - Keyboard shortcuts help

### Form Components

39. **MentionTextarea** - Textarea with @mention support
40. **ReactionBar** - Reaction display bar
41. **ReactionPicker** - Reaction picker component
42. **TipTapEditor** - Rich text editor component

### Team Components

43. **AddMemberModal** - Add team member modal
44. **AddTeamMemberModal** - Add team member modal variant
45. **EditTeamModal** - Edit team modal
46. **AddBoardModal** - Add board modal
47. **AddBoardToTeamModal** - Add board to team modal

### Utility Components

48. **LoadingSkeleton** - Loading skeleton component
49. **SidebarSkeleton** - Sidebar loading skeleton
50. **LanguageSwitcher** - Language selection component
51. **VibeButton** - Vibe design system button wrapper
52. **TwoFactorAuthSetup** - 2FA setup component
53. **ShareWorkdocModal** - Workdoc sharing modal
54. **BoardTemplateGallery** - Board template gallery
55. **SlashCommands** - Slash command interface

---

## View Types

### 1. Table View
- **Component**: `frontend/src/views/TableView.tsx`
- **Features**:
  - Grid layout with columns
  - Inline cell editing
  - Row selection
  - Column resizing
  - Sorting
  - Filtering

### 2. Kanban View
- **Component**: `frontend/src/views/KanbanView.tsx`
- **Features**:
  - Column-based layout
  - Drag-and-drop between columns
  - Status-based grouping
  - Card display

### 3. Calendar View
- **Component**: `frontend/src/views/CalendarView.tsx`
- **Features**:
  - Calendar grid display
  - Date-based filtering
  - Event display
  - Month/week/day views

### 4. Gantt View
- **Component**: `frontend/src/views/GanttView.tsx`
- **Features**:
  - Timeline visualization
  - Dependency lines
  - Task bars
  - Date range display

### 5. Timeline View
- **Component**: `frontend/src/views/TimelineView.tsx`
- **Features**:
  - Horizontal timeline
  - Item positioning
  - Date-based visualization

---

## Column Types

1. **TEXT** - Plain text input
2. **NUMBER** - Numeric input with validation
3. **STATUS** - Dropdown with custom status options
4. **PRIORITY** - Priority levels (Low, Medium, High, Critical)
5. **DATE** - Date picker with time support
6. **PERSON/PEOPLE** - User assignment with multi-select
7. **FILES** - File upload and display
8. **RATING** - Star rating (1-5 stars)
9. **TAGS** - Multi-select tags with custom colors

---

## Dashboard Widgets

1. **NumbersWidget** - Display numeric metrics (sum, average, count)
2. **ChartWidget** - Visualize data with charts (bar, line, pie)
3. **ClockWidget** - Display current time
4. **BoardWidget** - Embedded board view
5. **TextWidget** - Rich text content display

---

## Summary Statistics

- **Total Backend API Endpoints**: 159+ endpoints across 29 route modules
- **Total Frontend Pages**: 20+ pages
- **Total Frontend Components**: 55+ components
- **View Types**: 5 (Table, Kanban, Calendar, Gantt, Timeline)
- **Column Types**: 9 (TEXT, NUMBER, STATUS, PRIORITY, DATE, PERSON, FILES, RATING, TAGS)
- **Dashboard Widgets**: 5 types
- **Authentication Methods**: JWT, 2FA
- **Real-time Features**: Socket.io for live updates
- **File Support**: Upload, download, attachments
- **Export Formats**: Excel, CSV, PDF
- **Integrations**: Slack, Microsoft Teams, Webhooks

---

## Next Steps

1. Create FUNCTION_MATRIX.md - Cross-reference matrix
2. Create TEST_CASES.md - Detailed test cases for each function
3. Begin browser-based functional testing
4. Document issues and improvements



