import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { Task } from '../../models/task.model';
import { Category } from '../../models/category.model';
import { TodoFacade } from '../../services/todo.facade';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { CategoryBadgeComponent } from '../category-badge/category-badge.component';

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
    PriorityBadgeComponent,
    StatusBadgeComponent,
    CategoryBadgeComponent,
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
  readonly showCompleteButton = input<boolean>(true);
  readonly showReopenButton = input<boolean>(false);

  readonly editTask = output<string>();
  readonly completeTask = output<string>();
  readonly reopenTask = output<string>();
  readonly deleteTask = output<string>();

  readonly isDone = () => this.task().status === 'done';

  readonly dueDateFormatted = () => {
    const dueDate = this.task().due_date;
    if (!dueDate) return null;
    return this.datePipe.transform(dueDate, 'MMM d, yyyy');
  };

  readonly isOverdue = () => {
    if (this.isDone()) return false;
    const dueDate = this.task().due_date;
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

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
}
