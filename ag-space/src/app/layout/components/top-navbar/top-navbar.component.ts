import { ChangeDetectionStrategy, Component, signal, output, input, inject, computed } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavbarComponent {
  private readonly authService = inject(AuthService);

  readonly sidebarCollapsed = input<boolean>(false);
  readonly menuToggleClicked = output<void>();
  readonly isDarkMode = signal(true);

  readonly profile = this.authService.profile;
  readonly userInitials = computed(() => {
    const profile = this.profile();
    if (profile?.full_name) {
      const names = profile.full_name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return profile.full_name.substring(0, 2).toUpperCase();
    }
    return 'AG';
  });

  onMenuToggle(): void {
    this.menuToggleClicked.emit();
  }

  toggleTheme(): void {
    this.isDarkMode.update((dark) => !dark);
  }

  async onLogout(): Promise<void> {
    await this.authService.signOut();
  }
}
