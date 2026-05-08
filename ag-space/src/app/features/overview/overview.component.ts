import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/auth/auth.service';

interface Stat {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly color: string;
  readonly trend: number;
}

interface Task {
  readonly title: string;
  readonly project: string;
  readonly dueDate: string;
  readonly completed: boolean;
}

interface TodayItem {
  readonly time: string;
  readonly title: string;
  readonly type: string;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [NgClass, ButtonModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewComponent {
  private readonly authService = inject(AuthService);

  readonly profile = this.authService.profile;
  readonly displayName = computed(() => {
    const profile = this.profile();
    return profile?.full_name ?? 'User';
  });

  readonly stats: Stat[] = [
    { label: 'Active Projects', value: '12', icon: 'pi pi-folder', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', trend: 8 },
    { label: 'Tasks Completed', value: '48', icon: 'pi pi-check-circle', color: 'linear-gradient(135deg, #10b981, #059669)', trend: 12 },
    { label: 'Team Members', value: '8', icon: 'pi pi-users', color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', trend: 0 },
    { label: 'Hours Logged', value: '164', icon: 'pi pi-clock', color: 'linear-gradient(135deg, #f59e0b, #d97706)', trend: -3 },
  ];

  readonly recentTasks: Task[] = [
    { title: 'Update dashboard components', project: 'AG Space', dueDate: 'Today', completed: false },
    { title: 'Review pull request #42', project: 'API Integration', dueDate: 'Today', completed: false },
    { title: 'Write unit tests for auth', project: 'Security', dueDate: 'Tomorrow', completed: true },
    { title: 'Design system documentation', project: 'Design', dueDate: 'This week', completed: false },
  ];

  readonly todayItems: TodayItem[] = [
    { time: '09:00', title: 'Team standup meeting', type: 'Meeting' },
    { time: '11:00', title: 'Code review session', type: 'Review' },
    { time: '14:00', title: 'Project planning', type: 'Planning' },
    { time: '16:00', title: 'Client demo call', type: 'Meeting' },
  ];

  abs(value: number): number {
    return Math.abs(value);
  }
}
