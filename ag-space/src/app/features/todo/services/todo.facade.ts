import { Injectable, inject, signal, computed } from '@angular/core';
import { TodoApiService } from './todo-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Category, UNCATEGORIZED } from '../models/category.model';
import { Task, TaskFilter, TaskStatus, TaskPriority } from '../models/task.model';

interface TodoState {
  tasks: Task[];
  categories: Category[];
  selectedTaskId: string | null;
  isLoading: boolean;
  error: string | null;
  filter: TaskFilter;
}

@Injectable({
  providedIn: 'root',
})
export class TodoFacade {
  private readonly api = inject(TodoApiService);
  private readonly authService = inject(AuthService);

  // ==================== STATE SIGNALS ====================
  
  private readonly state = signal<TodoState>({
    tasks: [],
    categories: [],
    selectedTaskId: null,
    isLoading: false,
    error: null,
    filter: { is_archived: false },
  });

  // ==================== PUBLIC STATE READS ====================
  
  readonly tasks = computed(() => this.state().tasks);
  readonly categories = computed(() => this.state().categories);
  readonly selectedTaskId = computed(() => this.state().selectedTaskId);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly currentFilter = computed(() => this.state().filter);

  readonly selectedTask = computed(() => {
    const id = this.state().selectedTaskId;
    if (!id) return null;
    return this.state().tasks.find(t => t.id === id) || null;
  });

  // ==================== COMPUTED VIEWS ====================

  /**
   * Filtered tasks based on current filter state
   */
  readonly filteredTasks = computed(() => {
    let result = this.state().tasks;
    const filter = this.state().filter;

    // Apply search filter
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(searchTerm) ||
        (t.description?.toLowerCase().includes(searchTerm) ?? false)
      );
    }

    // Apply category filter
    if (filter.category_id !== undefined) {
      if (filter.category_id === null) {
        result = result.filter(t => t.category_id === null);
      } else {
        result = result.filter(t => t.category_id === filter.category_id);
      }
    }

    // Apply priority filter
    if (filter.priority) {
      result = result.filter(t => t.priority === filter.priority);
    }

    // Apply status filter
    if (filter.status) {
      result = result.filter(t => t.status === filter.status);
    }

    // Apply archived filter
    if (filter.is_archived !== undefined) {
      result = result.filter(t => t.is_archived === filter.is_archived);
    }

    return result;
  });

  /**
   * Today's tasks (due today, not done/cancelled, not archived)
   */
  readonly todayTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.state().tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= today && 
             dueDate < tomorrow && 
             !t.is_archived && 
             t.status !== 'done' && 
             t.status !== 'cancelled';
    });
  });

  /**
   * Overdue tasks (due before today, not done/cancelled, not archived)
   */
  readonly overdueTasks = computed(() => {
    const now = new Date();
    
    return this.state().tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate < now && 
             !t.is_archived && 
             t.status !== 'done' && 
             t.status !== 'cancelled';
    });
  });

  /**
   * Upcoming tasks (due after today, not done/cancelled, not archived)
   */
  readonly upcomingTasks = computed(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return this.state().tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= tomorrow && 
             !t.is_archived && 
             t.status !== 'done' && 
             t.status !== 'cancelled';
    });
  });

  /**
   * Completed tasks (status = done)
   */
  readonly completedTasks = computed(() => {
    return this.state().tasks.filter(t => t.status === 'done');
  });

  /**
   * Active tasks (not done, not cancelled, not archived)
   */
  readonly activeTasks = computed(() => {
    return this.state().tasks.filter(t => 
      !t.is_archived && 
      t.status !== 'done' && 
      t.status !== 'cancelled'
    );
  });

  /**
   * Tasks grouped by category (including Uncategorized for null category_id)
   */
  readonly tasksByCategory = computed(() => {
    const grouped = new Map<string, Task[]>();
    
    // Initialize with all categories (including Uncategorized)
    grouped.set('uncategorized', []);
    this.state().categories.forEach(c => {
      grouped.set(c.id, []);
    });

    // Group tasks
    this.state().tasks.forEach(task => {
      const key = task.category_id || 'uncategorized';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(task);
    });

    return grouped;
  });

  /**
   * Get category by ID (returns Uncategorized constant for null/undefined)
   */
  getCategoryById(categoryId: string | null): Category {
    if (!categoryId) return UNCATEGORIZED;
    return this.state().categories.find(c => c.id === categoryId) || UNCATEGORIZED;
  }

  // ==================== LOAD METHODS ====================

  async loadCategories(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    const { data, error } = await this.api.getCategories();

    if (error) {
      this.setError(error.message);
    } else {
      this.state.update(s => ({ ...s, categories: data || [] }));
    }

    this.setLoading(false);
  }

  async loadTasks(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    const { data, error } = await this.api.getTasks();

    if (error) {
      this.setError(error.message);
    } else {
      this.state.update(s => ({ ...s, tasks: data || [] }));
    }

    this.setLoading(false);
  }

  async loadTasksWithFilter(filter: TaskFilter): Promise<void> {
    this.setLoading(true);
    this.setError(null);
    this.state.update(s => ({ ...s, filter }));

    const { data, error } = await this.api.getTasksWithFilters(filter);

    if (error) {
      this.setError(error.message);
    } else {
      this.state.update(s => ({ ...s, tasks: data || [] }));
    }

    this.setLoading(false);
  }

  async loadTodayTasks(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    const { data, error } = await this.api.getTodayTasks();

    if (error) {
      this.setError(error.message);
    } else {
      this.state.update(s => ({ ...s, tasks: data || [] }));
    }

    this.setLoading(false);
  }

  async loadOverdueTasks(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    const { data, error } = await this.api.getOverdueTasks();

    if (error) {
      this.setError(error.message);
    } else {
      this.state.update(s => ({ ...s, tasks: data || [] }));
    }

    this.setLoading(false);
  }

  async loadUpcomingTasks(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    const { data, error } = await this.api.getUpcomingTasks();

    if (error) {
      this.setError(error.message);
    } else {
      this.state.update(s => ({ ...s, tasks: data || [] }));
    }

    this.setLoading(false);
  }

  async loadCompletedTasks(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    const { data, error } = await this.api.getCompletedTasks();

    if (error) {
      this.setError(error.message);
    } else {
      this.state.update(s => ({ ...s, tasks: data || [] }));
    }

    this.setLoading(false);
  }

  // ==================== TASK CRUD METHODS ====================

  async createTask(taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'>): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    const user = this.authService.user();
    if (!user) {
      this.setError('User not authenticated');
      this.setLoading(false);
      return false;
    }

    const { data, error } = await this.api.createTask({
      user_id: user.id,
      title: taskData.title,
      description: taskData.description ?? undefined,
      category_id: taskData.category_id,
      priority: taskData.priority,
      status: taskData.status,
      start_date: taskData.start_date,
      due_date: taskData.due_date,
    });

    if (error || !data) {
      this.setError(error?.message || 'Failed to create task');
      this.setLoading(false);
      return false;
    }

    this.state.update(s => ({
      ...s,
      tasks: [data, ...s.tasks],
    }));

    this.setLoading(false);
    return true;
  }

  async updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    const { data, error } = await this.api.updateTask(taskId, updates);

    if (error || !data) {
      this.setError(error?.message || 'Failed to update task');
      this.setLoading(false);
      return false;
    }

    this.state.update(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === taskId ? data : t),
    }));

    this.setLoading(false);
    return true;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    const { error } = await this.api.deleteTask(taskId);

    if (error) {
      this.setError(error.message);
      this.setLoading(false);
      return false;
    }

    this.state.update(s => ({
      ...s,
      tasks: s.tasks.filter(t => t.id !== taskId),
    }));

    this.setLoading(false);
    return true;
  }

  // ==================== TASK STATUS METHODS ====================

  async completeTask(taskId: string): Promise<boolean> {
    return this.updateTaskStatus(taskId, 'done');
  }

  async reopenTask(taskId: string): Promise<boolean> {
    return this.updateTaskStatus(taskId, 'todo');
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    const { data, error } = await this.api.setTaskStatus(taskId, status);

    if (error || !data) {
      this.setError(error?.message || 'Failed to update task status');
      this.setLoading(false);
      return false;
    }

    this.state.update(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === taskId ? data : t),
    }));

    this.setLoading(false);
    return true;
  }

  // ==================== CATEGORY CRUD METHODS ====================

  async createCategory(name: string, color?: string, icon?: string): Promise<Category | null> {
    this.setLoading(true);
    this.setError(null);

    const { data, error } = await this.api.createCategory({ name, color, icon });

    if (error || !data) {
      this.setError(error?.message || 'Failed to create category');
      this.setLoading(false);
      return null;
    }

    this.state.update(s => ({
      ...s,
      categories: [...s.categories, data],
    }));

    this.setLoading(false);
    return data;
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    const { error } = await this.api.deleteCategory(categoryId);

    if (error) {
      this.setError(error.message);
      this.setLoading(false);
      return false;
    }

    // Update local state: remove category and update tasks
    this.state.update(s => ({
      ...s,
      categories: s.categories.filter(c => c.id !== categoryId),
      tasks: s.tasks.map(t => 
        t.category_id === categoryId ? { ...t, category_id: null } : t
      ),
    }));

    this.setLoading(false);
    return true;
  }

  // ==================== FILTER & SELECTION METHODS ====================

  setFilter(filter: TaskFilter): void {
    this.state.update(s => ({ ...s, filter }));
  }

  clearFilter(): void {
    this.state.update(s => ({ ...s, filter: { is_archived: false } }));
  }

  selectTask(taskId: string | null): void {
    this.state.update(s => ({ ...s, selectedTaskId: taskId }));
  }

  // ==================== PRIVATE HELPERS ====================

  private setLoading(loading: boolean): void {
    this.state.update(s => ({ ...s, isLoading: loading }));
  }

  private setError(error: string | null): void {
    this.state.update(s => ({ ...s, error }));
  }
}
