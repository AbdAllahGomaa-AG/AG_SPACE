import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [ToolbarModule, ButtonModule],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavbarComponent {
  readonly menuToggleClicked = output<void>();

  onMenuToggle(): void {
    this.menuToggleClicked.emit();
  }
}
