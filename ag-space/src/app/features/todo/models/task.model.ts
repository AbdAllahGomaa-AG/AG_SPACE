/**
 * Priority levels for tasks
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Status values for tasks
 */
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';

/**
 * Task model matching Supabase schema
 * Note: start_date and due_date use timestamptz (unified type)
 */
export interface Task {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  parent_id: string | null;
  sort_order: number;
  start_date: string | null; // timestamptz
  due_date: string | null;   // timestamptz
  completed_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * DTO for creating a new task
 */
export interface CreateTaskRequest {
  user_id: string;
  title: string;
  description?: string;
  category_id?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  parent_id?: string | null;
  sort_order?: number;
  start_date?: string | null;
  due_date?: string | null;
}

/**
 * DTO for updating a task
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  category_id?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  start_date?: string | null;
  due_date?: string | null;
  is_archived?: boolean;
}

/**
 * Filter options for task queries
 */
export interface TaskFilter {
  search?: string;
  category_id?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  is_archived?: boolean;
  date_from?: string; // ISO date string
  date_to?: string;   // ISO date string
  overdue_only?: boolean;
  upcoming_only?: boolean;
  today_only?: boolean;
  completed_only?: boolean;
}

/**
 * Sort options for task lists
 */
export type TaskSortField = 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'title' | 'status';
export type TaskSortOrder = 'asc' | 'desc';

export interface TaskSort {
  field: TaskSortField;
  order: TaskSortOrder;
}

/**
 * Priority configuration for UI display
 */
export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; severity: number }> = {
  low: { label: 'Low', color: '#6b7280', severity: 1 },      // gray
  medium: { label: 'Medium', color: '#3b82f6', severity: 2 }, // blue
  high: { label: 'High', color: '#f59e0b', severity: 3 },     // amber
  urgent: { label: 'Urgent', color: '#ef4444', severity: 4 }, // red
};

/**
 * Status configuration for UI display
 */
export interface ReorderItem {
  id: string;
  sort_order: number;
  parent_id?: string | null;
  status?: TaskStatus;
}

export interface SubtaskProgress {
  total: number;
  completed: number;
  ratio: number;
  label: string;
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: string }> = {
  todo: { label: 'To Do', color: '#6b7280', icon: 'pi pi-circle' },
  in_progress: { label: 'In Progress', color: '#3b82f6', icon: 'pi pi-spinner' },
  blocked: { label: 'Blocked', color: '#ef4444', icon: 'pi pi-ban' },
  done: { label: 'Done', color: '#10b981', icon: 'pi pi-check-circle' },
  cancelled: { label: 'Cancelled', color: '#9ca3af', icon: 'pi pi-times-circle' },
};
