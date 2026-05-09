import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NutritionFacade } from '../../services/nutrition.facade';
import { NutrientDisplayComponent, NutrientValue } from '../../components/nutrient-display/nutrient-display.component';
import { MealTimelineComponent } from '../../components/meal-timeline/meal-timeline.component';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-meal-history',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    NutrientDisplayComponent, 
    MealTimelineComponent,
    ButtonModule,
    DatePickerModule
  ],
  templateUrl: './meal-history.page.html',
  styleUrl: './meal-history.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealHistoryPage implements OnInit {
  readonly facade = inject(NutritionFacade);

  selectedDate = signal<Date>(new Date());

  readonly currentDayData = computed(() => {
    const dateStr = this.selectedDate().toISOString().split('T')[0];
    return this.facade.history().find(h => h.date === dateStr) || null;
  });

  readonly historyNutrientValues = computed<NutrientValue[]>(() => {
    const data = this.currentDayData();
    if (!data || !data.summary) return [];

    const summary = data.summary;
    const goals = this.facade.goals();

    return [
      { label: 'Calories', value: summary.calories_total, target: goals?.calorie_target, unit: 'kcal' },
      { label: 'Protein', value: summary.protein_total_g, target: goals?.protein_target_g, unit: 'g', color: '#ef4444' },
      { label: 'Carbs', value: summary.carbs_total_g, target: goals?.carbs_target_g, unit: 'g', color: '#3b82f6' },
      { label: 'Fat', value: summary.fat_total_g, target: goals?.fat_target_g, unit: 'g', color: '#f59e0b' },
    ];
  });

  ngOnInit(): void {
    this.loadSelectedDate();
  }

  onDateChange(): void {
    this.loadSelectedDate();
  }

  previousDay(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.selectedDate.set(d);
    this.loadSelectedDate();
  }

  nextDay(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.selectedDate.set(d);
    this.loadSelectedDate();
  }

  private loadSelectedDate(): void {
    const dateStr = this.selectedDate().toISOString().split('T')[0];
    this.facade.loadDayData(dateStr);
  }

  onDeleteMeal(mealId: string): void {
    const data = this.currentDayData();
    if (data) {
      const meal = data.meals.find(m => m.id === mealId);
      if (meal) {
        this.facade.deleteMeal(mealId, meal.logged_at);
      }
    }
  }
}
