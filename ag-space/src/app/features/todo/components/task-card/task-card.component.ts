import {
  ChangeDetectionStrategy, Component, OnInit, input, output,
  signal, computed, inject
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { Task, SubtaskProgress } from '../../models/task.model';
import { Category } from '../../models/category.model';
import { TodoFacade } from '../../services/todo.facade';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { CategoryBadgeComponent } from '../category-badge/category-badge.component';
import { SubtaskItemComponent } from '../subtask-item/subtask-item.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    CheckboxModule,
    TooltipModule,
    InputTextModule,
    PriorityBadgeComponent,
    StatusBadgeComponent,
    CategoryBadgeComponent,
    SubtaskItemComponent,
  ],
  providers: [DatePipe],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  private readonly facade = inject(TodoFacade);
  private readonly datePipe = inject(DatePipe);

  readonly task = input.required<Task>();
  readonly category = input<Category | null>(null);
  readonly subtasks = input<Task[]>([]);
  readonly showCompleteButton = input<boolean>(true);
  readonly showReopenButton = input<boolean>(false);

  readonly editTask = output<string>();
  readonly completeTask = output<string>();
  readonly reopenTask = output<string>();
  readonly deleteTask = output<string>();
  readonly subtaskToggled = output<{ id: string; completed: boolean }>();
  readonly subtaskDeleted = output<string>();
  readonly createSubtask = output<{ parentId: string; title: string }>();

  readonly isExpanded = signal(false);
  readonly newSubtaskTitle = signal('');

  readonly isDone = computed(() => this.task().status === 'done');

  readonly progress = computed<SubtaskProgress>(() => {
    const subs = this.subtasks();
    const total = subs.length;
    const completed = subs.filter(t => t.status === 'done').length;
    return {
      total,
      completed,
      ratio: total > 0 ? completed / total : 0,
      label: total > 0 ? `${completed}/${total}` : '',
    };
  });

  readonly dueDateFormatted = computed(() => {
    const dueDate = this.task().due_date;
    if (!dueDate) return null;
    return this.datePipe.transform(dueDate, 'MMM d, yyyy');
  });

  readonly isOverdue = computed(() => {
    if (this.isDone()) return false;
    const dueDate = this.task().due_date;
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  });

  onEdit(): void {
    this.editTask.emit(this.task().id);
  }

  onComplete(): void {
    this.completeTask.emit(this.task().id);
  }

  onReopen(): void {
    this.reopenTask.emit(this.task().id);
  }

  onDelete(): void {
    this.deleteTask.emit(this.task().id);
  }

  onCheckboxToggle(checked: boolean): void {
    if (checked) {
      this.completeTask.emit(this.task().id);
    } else {
      this.reopenTask.emit(this.task().id);
    }
  }

  toggleExpanded(): void {
    this.isExpanded.update(v => !v);
  }

  onSubtaskToggle(event: { id: string; completed: boolean }): void {
    this.subtaskToggled.emit(event);
  }

  onSubtaskDelete(subtaskId: string): void {
    this.subtaskDeleted.emit(subtaskId);
  }

  onAddSubtask(): void {
    const title = this.newSubtaskTitle().trim();
    if (!title) return;
    this.createSubtask.emit({ parentId: this.task().id, title });
    this.newSubtaskTitle.set('');
  }

  getProgressColor(ratio: number): string {
    if (ratio >= 1) return '#10b981';
    if (ratio >= 0.5) return '#3b82f6';
    if (ratio > 0) return '#f59e0b';
    return '#6b7280';
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  }
}
