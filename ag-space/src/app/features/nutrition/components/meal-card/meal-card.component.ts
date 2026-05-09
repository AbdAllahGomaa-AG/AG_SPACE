import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { Meal } from '../../models/meal.model';
import { ConfidenceBadgeComponent } from '../confidence-badge/confidence-badge.component';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-meal-card',
  standalone: true,
  imports: [NgClass, DecimalPipe, DatePipe, ConfidenceBadgeComponent, ButtonModule, TooltipModule],
  templateUrl: './meal-card.component.html',
  styleUrl: './meal-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealCardComponent {
  readonly meal = input.required<Meal>();
  readonly interactive = input<boolean>(true);
  readonly delete = output<string>();

  get totalCalories(): number {
    return this.meal().items?.reduce((sum, item) => sum + item.calories, 0) || 0;
  }

  get totalProtein(): number {
    return this.meal().items?.reduce((sum, item) => sum + item.protein_g, 0) || 0;
  }

  onDeleteClick(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.meal().id);
  }
}
