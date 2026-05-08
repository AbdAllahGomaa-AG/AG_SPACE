import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';

interface NavigationLink {
  readonly label: string;
  readonly icon: string;
  readonly route?: string;
}

@Component({
  selector: 'app-side-navigation',
  standalone: true,
  imports: [NgClass, RouterModule, TooltipModule, ButtonModule],
  templateUrl: './side-navigation.component.html',
  styleUrl: './side-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideNavigationComponent {
  readonly collapsed = input<boolean>(false);
  readonly mobileMenuOpen = input<boolean>(false);
  readonly closeMobileMenu = output<void>();

  readonly mainLinks: NavigationLink[] = [
    { label: 'To-dos', icon: 'pi pi-check-square', route: '/todos' },
  ];

  readonly workspaceLinks: NavigationLink[] = [];

  readonly accountLinks: NavigationLink[] = [];

  onCloseClick(): void {
    this.closeMobileMenu.emit();
  }

  onNavItemClick(): void {
    this.closeMobileMenu.emit();
  }
}
