import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../../core/supabase/supabase-client.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../models/category.model';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilter, TaskStatus, ReorderItem } from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TodoApiService {
  private readonly supabaseClient = inject(SupabaseClientService);
  private readonly authService = inject(AuthService);

  // ==================== CATEGORY METHODS ====================

  async getCategories(): Promise<{ data: Category[] | null; error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    return { data, error };
  }

  async createCategory(request: CreateCategoryRequest): Promise<{ data: Category | null; error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const user = this.authService.user();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await client
      .from('categories')
      .insert({
        name: request.name,
        color: request.color || '#9ca3af',
        icon: request.icon || 'pi pi-tag',
        user_id: user.id
      })
      .select()
      .single();

    return { data, error };
  }

  async updateCategory(id: string, request: UpdateCategoryRequest): Promise<{ data: Category | null; error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const { data, error } = await client
      .from('categories')
      .update(request)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  async deleteCategory(id: string): Promise<{ error: Error | null }> {
    const client = this.supabaseClient.getClient();
    // Tasks with this category will have category_id set to NULL via ON DELETE SET NULL
    const { error } = await client
      .from('categories')
      .delete()
      .eq('id', id);

    return { error };
  }

  // ==================== TASK METHODS ====================

  async getTasks(): Promise<{ data: Task[] | null; error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async getTaskById(id: string): Promise<{ data: Task | null; error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  }

  async createTask(request: CreateTaskRequest): Promise<{ data: Task | null; error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const { data, error } = await client
      .from('tasks')
      .insert(request)
      .select()
      .single();

    return { data, error };
  }

  async updateTask(id: string, request: UpdateTaskRequest): Promise<{ data: Task | null; error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const { data, error } = await client
      .from('tasks')
      .update(request)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  async deleteTask(id: string): Promise<{ error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const { error } = await client
      .from('tasks')
      .delete()
      .eq('id', id);

    return { error };
  }

  // ==================== CONSOLIDATED FILTER METHOD ====================

  /**
   * Single flexible method for querying tasks with filters
   * All view methods below use this internally
   */
  async getTasksWithFilters(filter: TaskFilter): Promise<{ data: Task[] | null; error: Error | null }> {
    const client = this.supabaseClient.getClient();
    let query = client.from('tasks').select('*');

    // Base filters
    if (filter.is_archived !== undefined) {
      query = query.eq('is_archived', filter.is_archived);
    } else {
      // Default to non-archived
      query = query.eq('is_archived', false);
    }

    // Category filter (null = Uncategorized)
    if (filter.category_id !== undefined) {
      if (filter.category_id === null) {
        query = query.is('category_id', null);
      } else {
        query = query.eq('category_id', filter.category_id);
      }
    }

    // Priority filter
    if (filter.priority) {
      query = query.eq('priority', filter.priority);
    }

    // Status filter
    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    // Search filter (title or description)
    if (filter.search && filter.search.trim()) {
      const searchTerm = filter.search.trim();
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Date range filters
    if (filter.date_from) {
      query = query.gte('due_date', filter.date_from);
    }
    if (filter.date_to) {
      query = query.lte('due_date', filter.date_to);
    }

    // Special view filters
    const now = new Date().toISOString();

    if (filter.today_only) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query = query
        .gte('due_date', today.toISOString())
        .lt('due_date', tomorrow.toISOString())
        .eq('is_archived', false)
        .neq('status', 'done')
        .neq('status', 'cancelled');
    }

    if (filter.overdue_only) {
      query = query
        .lt('due_date', now)
        .eq('is_archived', false)
        .neq('status', 'done')
        .neq('status', 'cancelled');
    }

    if (filter.upcoming_only) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      query = query
        .gte('due_date', tomorrow.toISOString())
        .eq('is_archived', false)
        .neq('status', 'done')
        .neq('status', 'cancelled');
    }

    if (filter.completed_only) {
      query = query.eq('status', 'done');
    }

    // Default ordering: priority (high first), then due date
    query = query
      .order('priority', { ascending: false }) // urgent > high > medium > low
      .order('due_date', { ascending: true }); // earlier first

    const { data, error } = await query;
    return { data, error };
  }

  // ==================== VIEW WRAPPER METHODS ====================
  // These are lightweight wrappers around getTasksWithFilters

  async getTodayTasks(): Promise<{ data: Task[] | null; error: Error | null }> {
    return this.getTasksWithFilters({ today_only: true });
  }

  async getOverdueTasks(): Promise<{ data: Task[] | null; error: Error | null }> {
    return this.getTasksWithFilters({ overdue_only: true });
  }

  async getUpcomingTasks(): Promise<{ data: Task[] | null; error: Error | null }> {
    return this.getTasksWithFilters({ upcoming_only: true });
  }

  async getCompletedTasks(): Promise<{ data: Task[] | null; error: Error | null }> {
    return this.getTasksWithFilters({ completed_only: true });
  }

  // ==================== STATUS METHODS ====================

  async completeTask(id: string): Promise<{ data: Task | null; error: Error | null }> {
    // Updating status to 'done' triggers completed_at in database
    return this.updateTask(id, { status: 'done' });
  }

  async reopenTask(id: string): Promise<{ data: Task | null; error: Error | null }> {
    // Changing status away from 'done' clears completed_at in database
    return this.updateTask(id, { status: 'todo' });
  }

  async setTaskStatus(id: string, status: TaskStatus): Promise<{ data: Task | null; error: Error | null }> {
    return this.updateTask(id, { status });
  }

  // ==================== SUBTASK METHODS ====================

  async getSubtasks(parentId: string): Promise<{ data: Task[] | null; error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true });

    return { data, error };
  }

  async createSubtask(parentId: string, title: string): Promise<{ data: Task | null; error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const user = this.authService.user();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await client
      .from('tasks')
      .insert({
        user_id: user.id,
        title,
        parent_id: parentId,
        status: 'todo',
      })
      .select()
      .single();

    return { data, error };
  }

  async batchReorder(items: ReorderItem[]): Promise<{ error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const updates = items.map(item => ({
      id: item.id,
      sort_order: item.sort_order,
      parent_id: item.parent_id ?? null,
      status: item.status,
    }));

    // Use a single RPC call for atomic batch update
    const { error } = await client.rpc('batch_reorder_tasks', { items: updates });

    if (error) {
      // Fallback: update individually if RPC not available
      for (const update of updates) {
        const updatePayload: Record<string, unknown> = { sort_order: update.sort_order };
        if (update.parent_id !== undefined) updatePayload['parent_id'] = update.parent_id;
        if (update.status) updatePayload['status'] = update.status;
        const { error: itemError } = await client
          .from('tasks')
          .update(updatePayload)
          .eq('id', update.id);
        if (itemError) return { error: itemError };
      }
    }

    return { error: null };
  }

  async deleteSubtasksBulk(taskIds: string[]): Promise<{ error: Error | null }> {
    const client = this.supabaseClient.getClient();
    const { error } = await client
      .from('tasks')
      .delete()
      .in('id', taskIds);

    return { error };
  }
}
