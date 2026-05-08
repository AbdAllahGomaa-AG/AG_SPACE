import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TopNavbarComponent } from '../components/top-navbar/top-navbar.component';
import { SideNavigationComponent } from '../components/side-navigation/side-navigation.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [NgClass, ButtonModule, RouterOutlet, TopNavbarComponent, SideNavigationComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardShellComponent {
  private readonly authService = inject(AuthService);

  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);

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
}
