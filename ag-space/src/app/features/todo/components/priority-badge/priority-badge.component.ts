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
      [class]="'priority-' + priority().toLowerCase()"
      [style.color]="config().color"
      [style.border-color]="config().color + '40'"
      [style.background-color]="config().color + '15'">
      <i [class]="getIcon()"></i>
      {{ config().label }}
    </span>
  `,
  styles: [`
    .priority-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3125rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid;
      white-space: nowrap;
      text-transform: capitalize;
      letter-spacing: 0.01em;
    }

    .priority-badge i {
      font-size: 0.8125rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityBadgeComponent {
  readonly priority = input.required<TaskPriority>();

  readonly config = () => PRIORITY_CONFIG[this.priority()];

  getIcon(): string {
    switch (this.priority()) {
      case 'URGENT': return 'pi pi-exclamation-triangle';
      case 'HIGH': return 'pi pi-angle-double-up';
      case 'MEDIUM': return 'pi pi-angle-up';
      case 'LOW': return 'pi pi-angle-down';
      default: return 'pi pi-minus';
    }
  }
}
