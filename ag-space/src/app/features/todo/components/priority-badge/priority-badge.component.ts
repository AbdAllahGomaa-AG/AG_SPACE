import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { TaskPriority, PRIORITY_CONFIG } from '../../models/task.model';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule, BadgeModule],
  template: `
    <span 
      class="priority-badge"
      [style.background-color]="config().color + '20'"
      [style.color]="config().color"
      [style.border-color]="config().color">
      {{ config().label }}
    </span>
  `,
  styles: [`
    .priority-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      border: 1px solid;
      white-space: nowrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityBadgeComponent {
  readonly priority = input.required<TaskPriority>();

  readonly config = () => PRIORITY_CONFIG[this.priority()];
}
