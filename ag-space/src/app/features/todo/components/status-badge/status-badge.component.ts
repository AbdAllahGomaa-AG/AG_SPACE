import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskStatus, STATUS_CONFIG } from '../../models/task.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="status-badge"
      [class]="'status-' + status()"
      [style.background-color]="config().color + '20'"
      [style.color]="config().color">
      <i [class]="config().icon"></i>
      <span>{{ config().label }}</span>
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .status-badge i {
      font-size: 0.75rem;
    }

    .status-done {
      text-decoration: line-through;
      opacity: 0.7;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<TaskStatus>();

  readonly config = () => STATUS_CONFIG[this.status()];
}
