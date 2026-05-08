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
      [class]="'status-' + status().toLowerCase()"
      [style.color]="config().color"
      [style.border-color]="config().color + '30'"
      [style.background-color]="config().color + '12'">
      <i [class]="config().icon"></i>
      <span>{{ config().label }}</span>
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3125rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid;
      white-space: nowrap;
      letter-spacing: 0.01em;
      transition: all 0.2s ease;
    }

    .status-badge i {
      font-size: 0.8125rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<TaskStatus>();

  readonly config = () => STATUS_CONFIG[this.status()];
}
