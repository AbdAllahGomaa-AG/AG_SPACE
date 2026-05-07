import { ChangeDetectionStrategy, Component, signal, output, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavbarComponent {
  readonly sidebarCollapsed = input<boolean>(false);
  readonly menuToggleClicked = output<void>();
  readonly isDarkMode = signal(true);

  onMenuToggle(): void {
    this.menuToggleClicked.emit();
  }

  toggleTheme(): void {
    this.isDarkMode.update((dark) => !dark);
  }
}
