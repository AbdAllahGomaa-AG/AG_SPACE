# AG-SPACE — Kanban Task Manager

## Architecture Overview

Angular 21 standalone application with Supabase (PostgreSQL) backend.
Feature-first, signal-based state management with OnPush change detection.

---

## Directory Structure

```
src/
├── app/
│   ├── core/                          # Singletons (auth, supabase client)
│   ├── features/
│   │   └── todo/                      # Task management domain
│   │       ├── components/
│   │       │   ├── task-card/          # Task card with progress, subtasks, expand
│   │       │   ├── task-list/          # List with drag-and-drop, skeletons, empty state
│   │       │   ├── task-form/          # Create/edit task dialog form
│   │       │   ├── task-filters/       # Search, category, priority, status filters
│   │       │   ├── subtask-item/       # NEW: Individual subtask row with drag handle
│   │       │   ├── status-badge/       # Status display chip
│   │       │   ├── priority-badge/     # Priority display chip
│   │       │   └── category-badge/     # Category display chip
│   │       ├── pages/
│   │       │   ├── todo-list/          # All tasks (with filters)
│   │       │   ├── todo-today/         # Tasks due today
│   │       │   ├── todo-upcoming/      # Tasks due after today
│   │       │   ├── todo-overdue/       # Tasks past due date
│   │       │   └── todo-completed/     # Done tasks
│   │       ├── services/
│   │       │   ├── todo-api.service.ts # Supabase data access layer
│   │       │   └── todo.facade.ts      # Signal state management
│   │       ├── models/
│   │       │   ├── task.model.ts       # Task, ReorderItem, SubtaskProgress
│   │       │   └── category.model.ts   # Category
│   │       ├── todo.routes.ts          # Lazy-loaded routes
│   │       └── index.ts                # Barrel exports
│   ├── app.ts, app.routes.ts, app.config.ts
│   └── layout/                         # Shell layout (dashboard-shell, navbar, sidenav)
├── supabase/
│   └── migrations/
│       ├── 001_create_categories_table.sql
│       ├── 002_create_tasks_table.sql
│       ├── 003_create_user_signup_trigger.sql
│       ├── 004_create_task_status_trigger.sql
│       ├── 005_add_subtasks.sql         # NEW: parent_id, sort_order, validation trigger
│       ├── 006_add_sort_order_trigger.sql # NEW: auto-assign sort_order on INSERT
│       └── 007_create_batch_reorder_rpc.sql # NEW: atomic batch reorder RPC
└── styles.css                          # Global styles
```

---

## Data Model

### Task (tasks table)
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK, gen_random_uuid() |
| user_id | uuid | FK -> auth.users, RLS enforced |
| category_id | uuid | FK -> categories (ON DELETE SET NULL) |
| parent_id | uuid | NEW: FK -> tasks (ON DELETE CASCADE) |
| title | text | Required |
| description | text | Optional |
| priority | enum | low, medium, high, urgent |
| status | enum | todo, in_progress, blocked, done, cancelled |
| sort_order | integer | NEW: For drag-and-drop ordering |
| start_date | timestamptz | Optional |
| due_date | timestamptz | Optional |
| completed_at | timestamptz | Auto-managed by trigger |
| is_archived | boolean | Default false |

### Category (categories table)
| Field | Type |
|-------|------|
| id | uuid |
| user_id | uuid |
| name | text |
| color | text |
| icon | text |
| is_default | boolean |

---

## State Management (TodoFacade)

Pattern: Single `signal<TodoState>` with computed derivations.

### Core State
- `tasks` — All tasks for current user
- `categories` — All categories for current user
- `selectedTaskId` — Currently selected/focused task
- `isLoading` — Async operation in progress
- `error` — Last error message
- `filter` — Active filter criteria

### Computed Views
- `filteredTasks` — Root tasks only, filtered by current filter
- `rootTasks` — All root tasks sorted by sort_order
- `sortedTasks` — All tasks (parents + children) in display order
- `todayTasks`, `overdueTasks`, `upcomingTasks`, `completedTasks`, `activeTasks` — View-specific filters (root tasks only)
- `tasksByCategory` — Root tasks grouped by category

### Subtask Helpers
- `getSubtasks(taskId)` — Returns subtasks sorted by sort_order
- `getTaskProgress(taskId)` — Returns SubtaskProgress { total, completed, ratio, label }

---

## Key Flows

### Task Creation
Page -> Facade.createTask() -> ApiService.createTask() -> Supabase INSERT -> State update

### Subtask Creation (NEW)
TaskCard (inline form) -> Facade.createSubtask() -> ApiService.createSubtask() -> Supabase INSERT -> State update

### Drag-and-Drop Reorder (NEW)
TaskList (HTML5 DnD) -> Facade.reorderTasks() -> Optimistic UI update -> ApiService.batchReorder() -> Rollback on failure

### Subtask Toggle (NEW)
SubtaskItem (checkbox) -> TaskCard -> Facade.toggleSubtask() -> Optimistic status update -> ApiService.setTaskStatus() -> Rollback on failure

### Task Deletion
Page -> Facade.deleteTask() -> Recursively collects subtask IDs -> ApiService.deleteSubtasksBulk() -> State cleanup

---

## API Service Layer

### New Methods
- `getSubtasks(parentId)` — Fetch subtasks for a parent
- `createSubtask(parentId, title)` — Create subtask
- `batchReorder(items)` — Atomic reorder (with RPC fallback)
- `deleteSubtasksBulk(taskIds)` — Batch delete for cascading

---

## Drag-and-Drop Implementation

Native HTML5 Drag and Drop API (no external dependencies):
- `dragstart` — Sets source index, adds visual feedback
- `dragover` — Shows drop indicator line
- `drop` — Computes reorder items, calls facade (optimistic)
- `dragend` — Cleans up visual states
- Touch fallback via standard browser behavior

---

## UI/UX Features

### Task Card
- Progress bar with color coding (red < 50%, blue >= 50%, green = 100%)
- Subtask count badge with expand/collapse toggle
- Inline "Add subtask" form
- Subtask list with drag handles, checkbox, delete
- Skeleton loading state
- Hover animations, smooth transitions

### Task List
- CSS skeleton cards during loading
- Drag-and-drop with visual drop indicators
- Empty state with animated bounce icon
- Responsive design (mobile-optimized)

---

## Database Migrations

| # | File | Purpose |
|---|------|---------|
| 005 | `005_add_subtasks.sql` | Adds parent_id, sort_order, index, validation trigger |
| 006 | `006_add_sort_order_trigger.sql` | Auto-assigns sort_order on INSERT |
| 007 | `007_create_batch_reorder_rpc.sql` | Atomic batch reorder function |

Apply migrations in order. RPC is optional (fallback to individual updates exists).

---

## ORPHANS & PENDING

- [ ] Drag-and-drop between status groups (kanban-style column drag) — not implemented; current DnD is reorder-only within flat list
- [ ] Unlimited subtask depth — schema supports it but frontend renders 1 level; deeper nesting requires recursive component
- [ ] Mobile touch drag — relies on browser default behavior; custom touch handlers could improve UX
- [ ] Realtime sync (WebSocket) — no realtime subscription to Supabase changes yet
- [ ] Unit tests for new facade methods — test coverage pending

---

## Known Risks

1. **Supabase migration 005** adds NOT NULL sort_order with DEFAULT 0 — existing rows get 0
2. **ON DELETE CASCADE** on parent_id — deleting a parent deletes all subtasks
3. **Drag-and-drop** may conflict with touch scrolling on mobile — mitigated by small drag handles
4. **Optimistic updates** may briefly desync if batch reorder RPC fails and fallback partially succeeds
5. **Subtasks excluded from computed views** — ensures they don't appear as root tasks
