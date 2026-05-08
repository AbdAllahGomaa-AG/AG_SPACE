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
      [style.color]="displayCategory().color"
      [style.border-color]="displayCategory().color + '30'"
      [style.background-color]="displayCategory().color + '12'">
      <i [class]="displayCategory().icon"></i>
      <span>{{ displayCategory().name }}</span>
    </span>
  `,
  styles: [`
    .category-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3125rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid;
      white-space: nowrap;
      letter-spacing: 0.01em;
      transition: all 0.2s ease;
    }

    .category-badge i {
      font-size: 0.8125rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBadgeComponent {
  readonly category = input<Category | null>(null);

  readonly displayCategory = () => this.category() || UNCATEGORIZED;
}
