import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { TopNavbarComponent } from '../components/top-navbar/top-navbar.component';
import { SideNavigationComponent } from '../components/side-navigation/side-navigation.component';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [NgClass, TopNavbarComponent, SideNavigationComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardShellComponent {
  readonly mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((menuOpen) => !menuOpen);
  }
}
