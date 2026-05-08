import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, UNCATEGORIZED } from '../../models/category.model';

@Component({
  selector: 'app-category-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-badge.component.html',
  styleUrl: './category-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBadgeComponent {
  readonly category = input<Category | null>(null);

  readonly displayCategory = () => this.category() || UNCATEGORIZED;
}
