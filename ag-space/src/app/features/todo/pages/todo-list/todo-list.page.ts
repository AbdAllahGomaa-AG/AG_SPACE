import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TodoFacade } from '../../services/todo.facade';
import { TaskPriority, TaskStatus } from '../../models/task.model';
import { KanbanBoardComponent } from '../../components/kanban-board/kanban-board.component';
import { TaskFiltersComponent } from '../../components/task-filters/task-filters.component';
import { TaskFormComponent } from '../../components/task-form/task-form.component';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [
    CommonModule,
    KanbanBoardComponent,
    TaskFiltersComponent,
    TaskFormComponent,
    ButtonModule,
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './todo-list.page.html',
  styleUrl: './todo-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoListPage implements OnInit {
  private readonly facade = inject(TodoFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly isLoading = this.facade.isLoading;
  readonly error = this.facade.error;
  readonly tasks = this.facade.filteredTasks;
  readonly categories = this.facade.categories;

  readonly showTaskForm = signal(false);
  readonly editingTaskId = signal<string | null>(null);

  readonly viewTitle = computed(() => {
    const view = this.route.snapshot.data['view'];
    const categoryId = this.route.snapshot.params['id'];
    
    if (view === 'category' && categoryId) {
      const category = this.facade.getCategoryById(categoryId);
      return `Tasks: ${category.name}`;
    }
    return 'All Tasks';
  });

  ngOnInit(): void {
    this.loadData();
    this.handleRouteParams();
  }

  async loadData(): Promise<void> {
    await Promise.all([
      this.facade.loadCategories(),
      this.facade.loadTasks(),
    ]);
  }

  private handleRouteParams(): void {
    const view = this.route.snapshot.data['view'];
    const categoryId = this.route.snapshot.params['id'];

    if (view === 'category' && categoryId) {
      this.facade.setFilter({ category_id: categoryId, is_archived: false });
    }
  }

  onCreateTask(): void {
    this.editingTaskId.set(null);
    this.showTaskForm.set(true);
  }

  onEditTask(taskId: string): void {
    this.editingTaskId.set(taskId);
    this.showTaskForm.set(true);
  }

  onCloseForm(): void {
    this.showTaskForm.set(false);
    this.editingTaskId.set(null);
  }

  async onCompleteTask(taskId: string): Promise<void> {
    const success = await this.facade.completeTask(taskId);
    if (success) {
      this.messageService.add({
        severity: 'success',
        summary: 'Task completed',
        detail: 'Task marked as done',
        life: 2000,
      });
    } else {
      this.showError('Failed to complete task');
    }
  }

  async onReopenTask(taskId: string): Promise<void> {
    const success = await this.facade.reopenTask(taskId);
    if (success) {
      this.messageService.add({
        severity: 'info',
        summary: 'Task reopened',
        detail: 'Task moved back to To Do',
        life: 2000,
      });
    } else {
      this.showError('Failed to reopen task');
    }
  }

  async onDeleteTask(taskId: string): Promise<void> {
    const success = await this.facade.deleteTask(taskId);
    if (success) {
      this.messageService.add({
        severity: 'success',
        summary: 'Task deleted',
        detail: 'Task has been removed',
        life: 2000,
      });
    } else {
      this.showError('Failed to delete task');
    }
  }

  onFilterChange(filter: { search?: string; category_id?: string | null; priority?: TaskPriority; status?: TaskStatus }): void {
    this.facade.setFilter({
      ...filter,
      is_archived: false,
    });
  }

  onClearFilters(): void {
    this.facade.clearFilter();
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 3000,
    });
  }
}
