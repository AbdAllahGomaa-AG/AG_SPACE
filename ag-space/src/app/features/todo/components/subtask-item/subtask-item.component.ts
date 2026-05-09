import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Task } from '../../models/task.model';
import { TodoFacade } from '../../services/todo.facade';

@Component({
  selector: 'app-subtask-item',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckboxModule, ButtonModule, TooltipModule],
  templateUrl: './subtask-item.component.html',
  styleUrl: './subtask-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubtaskItemComponent {
  private readonly facade = inject(TodoFacade);

  readonly subtask = input.required<Task>();

  readonly deleted = output<string>();
  readonly toggled = output<{ id: string; completed: boolean }>();

  readonly isDone = () => this.subtask().status === 'done';

  onToggle(checked: boolean): void {
    this.toggled.emit({ id: this.subtask().id, completed: checked });
  }

  onDelete(): void {
    this.deleted.emit(this.subtask().id);
  }
}
