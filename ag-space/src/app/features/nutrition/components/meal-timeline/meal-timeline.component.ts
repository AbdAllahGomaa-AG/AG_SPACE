import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meal } from '../../models/meal.model';
import { MealCardComponent } from '../meal-card/meal-card.component';

@Component({
  selector: 'app-meal-timeline',
  standalone: true,
  imports: [CommonModule, MealCardComponent],
  templateUrl: './meal-timeline.component.html',
  styleUrl: './meal-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealTimelineComponent {
  readonly meals = input.required<Meal[]>();
  readonly deleteMeal = output<string>();

  onDelete(mealId: string): void {
    this.deleteMeal.emit(mealId);
  }
}
