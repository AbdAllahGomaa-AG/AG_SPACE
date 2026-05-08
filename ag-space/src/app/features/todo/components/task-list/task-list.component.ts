import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Task } from '../../models/task.model';
import { Category } from '../../models/category.model';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, TaskCardComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  readonly tasks = input.required<Task[]>();
  readonly categories = input.required<Category[]>();
  readonly isLoading = input<boolean>(false);
  readonly emptyMessage = input<string>('No tasks found');
  readonly showCompleteButton = input<boolean>(true);
  readonly showReopenButton = input<boolean>(false);

  readonly editTask = output<string>();
  readonly completeTask = output<string>();
  readonly reopenTask = output<string>();
  readonly deleteTask = output<string>();

  readonly hasTasks = computed(() => this.tasks().length > 0);

  getCategoryForTask(task: Task): Category | null {
    if (!task.category_id) return null;
    return this.categories().find((c: Category) => c.id === task.category_id) || null;
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
}
