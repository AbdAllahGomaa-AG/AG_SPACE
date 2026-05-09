import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NutritionFacade } from '../../services/nutrition.facade';
import { ProgressRingComponent } from '../../components/progress-ring/progress-ring.component';
import { NutrientDisplayComponent, NutrientValue } from '../../components/nutrient-display/nutrient-display.component';
import { MealTimelineComponent } from '../../components/meal-timeline/meal-timeline.component';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { computed } from '@angular/core';

@Component({
  selector: 'app-nutrition-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ProgressRingComponent, 
    NutrientDisplayComponent, 
    MealTimelineComponent,
    ButtonModule,
    SkeletonModule
  ],
  templateUrl: './nutrition-dashboard.page.html',
  styleUrl: './nutrition-dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutritionDashboardPage implements OnInit {
  readonly facade = inject(NutritionFacade);

  readonly nutrientValues = computed<NutrientValue[]>(() => {
    const progress = this.facade.dailyProgress();
    if (!progress) return [];

    return [
      { label: 'Protein', value: progress.protein.current, target: progress.protein.target, unit: 'g', color: '#ef4444' },
      { label: 'Carbs', value: progress.carbs.current, target: progress.carbs.target, unit: 'g', color: '#3b82f6' },
      { label: 'Fat', value: progress.fat.current, target: progress.fat.target, unit: 'g', color: '#f59e0b' },
    ];
  });

  ngOnInit(): void {
    this.facade.loadTodayData();
  }

  onDeleteMeal(mealId: string): void {
    const meal = this.facade.todayMeals().find(m => m.id === mealId);
    if (meal) {
      this.facade.deleteMeal(mealId, meal.logged_at);
    }
  }
}
