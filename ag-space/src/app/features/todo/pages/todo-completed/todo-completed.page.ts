import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoFacade } from '../../services/todo.facade';
import { TaskListComponent } from '../../components/task-list/task-list.component';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-todo-completed',
  standalone: true,
  imports: [CommonModule, TaskListComponent, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './todo-completed.page.html',
  styleUrl: './todo-completed.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoCompletedPage implements OnInit {
  private readonly facade = inject(TodoFacade);
  private readonly messageService = inject(MessageService);

  readonly isLoading = this.facade.isLoading;
  readonly error = this.facade.error;
  readonly tasks = this.facade.completedTasks;
  readonly categories = this.facade.categories;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    await Promise.all([
      this.facade.loadCategories(),
      this.facade.loadCompletedTasks(),
    ]);
  }

  async onCompleteTask(taskId: string): Promise<void> {
    // Already completed, no-op
  }

  async onReopenTask(taskId: string): Promise<void> {
    const success = await this.facade.reopenTask(taskId);
    if (success) {
      this.messageService.add({ severity: 'info', summary: 'Reopened', detail: 'Task moved back to To Do', life: 2000 });
    }
  }

  async onDeleteTask(taskId: string): Promise<void> {
    const success = await this.facade.deleteTask(taskId);
    if (success) {
      this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Task removed', life: 2000 });
    }
  }
}
