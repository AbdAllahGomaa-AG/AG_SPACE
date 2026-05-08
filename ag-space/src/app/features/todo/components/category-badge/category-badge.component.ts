import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, UNCATEGORIZED } from '../../models/category.model';

@Component({
  selector: 'app-category-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="category-badge"
      [style.background-color]="displayCategory().color + '20'"
      [style.color]="displayCategory().color">
      <i [class]="displayCategory().icon"></i>
      <span>{{ displayCategory().name }}</span>
    </span>
  `,
  styles: [`
    .category-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .category-badge i {
      font-size: 0.75rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBadgeComponent {
  readonly category = input<Category | null>(null);

  readonly displayCategory = () => this.category() || UNCATEGORIZED;
}
