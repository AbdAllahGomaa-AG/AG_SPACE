import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TopNavbarComponent } from '../components/top-navbar/top-navbar.component';
import { SideNavigationComponent } from '../components/side-navigation/side-navigation.component';
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
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [NgClass, ButtonModule, TopNavbarComponent, SideNavigationComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardShellComponent {
  private readonly authService = inject(AuthService);

  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);

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

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((menuOpen) => !menuOpen);
  }

  onMenuToggle(): void {
    // On mobile, toggle mobile menu. On desktop, toggle sidebar collapse.
    if (window.innerWidth < 768) {
      this.toggleMobileMenu();
    } else {
      this.toggleSidebar();
    }
  }

  abs(value: number): number {
    return Math.abs(value);
  }
}
