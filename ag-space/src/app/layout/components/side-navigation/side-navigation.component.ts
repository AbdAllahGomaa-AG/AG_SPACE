import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';

interface NavigationLink {
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-side-navigation',
  standalone: true,
  imports: [NgClass, TooltipModule, ButtonModule],
  templateUrl: './side-navigation.component.html',
  styleUrl: './side-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideNavigationComponent {
  readonly collapsed = input<boolean>(false);
  readonly mobileMenuOpen = input<boolean>(false);
  readonly closeMobileMenu = output<void>();

  readonly mainLinks: NavigationLink[] = [
    { label: 'Overview', icon: 'pi pi-home' },
    { label: 'Analytics', icon: 'pi pi-chart-bar' },
    { label: 'Projects', icon: 'pi pi-folder' },
    { label: 'Tasks', icon: 'pi pi-check-square' },
  ];

  readonly workspaceLinks: NavigationLink[] = [
    { label: 'Team', icon: 'pi pi-users' },
    { label: 'Documents', icon: 'pi pi-file' },
    { label: 'Calendar', icon: 'pi pi-calendar' },
  ];

  readonly accountLinks: NavigationLink[] = [
    { label: 'Settings', icon: 'pi pi-cog' },
    { label: 'Help', icon: 'pi pi-question-circle' },
  ];

  onCloseClick(): void {
    this.closeMobileMenu.emit();
  }

  onNavItemClick(): void {
    this.closeMobileMenu.emit();
  }
}
