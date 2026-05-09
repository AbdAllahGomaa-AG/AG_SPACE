import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NutritionFacade } from '../../services/nutrition.facade';
import { MealItem } from '../../models/meal.model';
import { NutrientDisplayComponent, NutrientValue } from '../../components/nutrient-display/nutrient-display.component';
import { ConfidenceBadgeComponent } from '../../components/confidence-badge/confidence-badge.component';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-meal-review',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    NutrientDisplayComponent, 
    ConfidenceBadgeComponent,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './meal-review.page.html',
  styleUrl: './meal-review.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealReviewPage implements OnInit {
  private readonly facade = inject(NutritionFacade);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly pendingAnalysis = this.facade.pendingAnalysis;
  readonly isLoading = this.facade.isLoading;

  mealName = signal('');
  mealType = signal<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'>('other');
  items = signal<MealItem[]>([]);
  imageFile: File | null = null;

  readonly mealTypes = [
    { label: 'Breakfast', value: 'breakfast' },
    { label: 'Lunch', value: 'lunch' },
    { label: 'Dinner', value: 'dinner' },
    { label: 'Snack', value: 'snack' },
    { label: 'Other', value: 'other' }
  ];

  readonly totals = computed(() => {
    const currentItems = this.items();
    return {
      calories: currentItems.reduce((sum, item) => sum + item.calories, 0),
      protein: currentItems.reduce((sum, item) => sum + item.protein_g, 0),
      carbs: currentItems.reduce((sum, item) => sum + item.carbs_g, 0),
      fat: currentItems.reduce((sum, item) => sum + item.fat_g, 0),
    };
  });

  readonly nutrientValues = computed<NutrientValue[]>(() => {
    const t = this.totals();
    return [
      { label: 'Calories', value: t.calories, unit: 'kcal' },
      { label: 'Protein', value: t.protein, unit: 'g', color: '#ef4444' },
      { label: 'Carbs', value: t.carbs, unit: 'g', color: '#3b82f6' },
      { label: 'Fat', value: t.fat, unit: 'g', color: '#f59e0b' },
    ];
  });

  ngOnInit(): void {
    const analysis = this.pendingAnalysis();
    if (!analysis) {
      this.router.navigate(['/nutrition/add']);
      return;
    }

    this.mealName.set(analysis.meal_name);
    this.items.set([...analysis.items]);

    // Recover image file from router state if available
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.imageFile = navigation.extras.state['imageFile'];
    }
  }

  addItem(): void {
    const newItem: MealItem = {
      name: 'New Item',
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugars_g: 0,
      sodium_mg: 0
    };
    this.items.update(current => [...current, newItem]);
  }

  removeItem(index: number): void {
    this.items.update(current => current.filter((_, i) => i !== index));
  }

  async onSave(): Promise<void> {
    const success = await this.facade.saveMeal(
      {
        meal_name: this.mealName(),
        meal_type: this.mealType(),
        input_mode: this.imageFile ? 'image' : 'text',
        logged_at: new Date().toISOString(),
        analysis_confidence: this.pendingAnalysis()?.analysis_confidence,
        is_confirmed: true
      },
      this.items(),
      this.imageFile || undefined
    );

    if (success) {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Meal logged successfully' });
      setTimeout(() => this.router.navigate(['/nutrition']), 500);
    } else {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: this.facade.error() || 'Failed to save meal' 
      });
    }
  }
}
