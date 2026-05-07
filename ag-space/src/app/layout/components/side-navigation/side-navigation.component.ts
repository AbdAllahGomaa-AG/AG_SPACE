import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { ButtonModule } from 'primeng/button';

interface NavigationLink {
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-side-navigation',
  standalone: true,
  imports: [NgClass, ButtonModule],
  templateUrl: './side-navigation.component.html',
  styleUrl: './side-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideNavigationComponent {
  readonly mobileMenuOpen = input<boolean>(false);

  readonly navigationLinks: NavigationLink[] = [
    { label: 'Overview', icon: 'pi pi-home' },
    { label: 'Reports', icon: 'pi pi-chart-bar' },
    { label: 'Settings', icon: 'pi pi-cog' },
  ];
}
