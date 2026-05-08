import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { TaskPriority, PRIORITY_CONFIG } from '../../models/task.model';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule, BadgeModule],
  templateUrl: './priority-badge.component.html',
  styleUrl: './priority-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityBadgeComponent {
  readonly priority = input.required<TaskPriority>();

  readonly config = () => PRIORITY_CONFIG[this.priority()];

  getIcon(): string {
    switch (this.priority()) {
      case 'urgent': return 'pi pi-exclamation-triangle';
      case 'high': return 'pi pi-angle-double-up';
      case 'medium': return 'pi pi-angle-up';
      case 'low': return 'pi pi-angle-down';
      default: return 'pi pi-minus';
    }
  }
}
