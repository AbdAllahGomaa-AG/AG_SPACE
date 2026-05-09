import { Injectable, inject, signal, computed } from '@angular/core';
import { NutritionApiService } from './nutrition-api.service';
import { NutritionAnalysisService } from './nutrition-analysis.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Meal, DailySummary, MealItem } from '../models/meal.model';
import { NutritionGoals } from '../models/nutrition-goal.model';
import { MealAnalysis, AnalyzeMealRequest } from '../models/ai-analysis.model';

interface NutritionState {
  todayMeals: Meal[];
  dailySummary: DailySummary | null;
  history: { date: string; summary: DailySummary | null; meals: Meal[] }[];
  pendingAnalysis: MealAnalysis | null;
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class NutritionFacade {
  private readonly api = inject(NutritionApiService);
  private readonly analysis = inject(NutritionAnalysisService);
  private readonly authService = inject(AuthService);

  // ==================== STATE SIGNALS ====================
  
  private readonly state = signal<NutritionState>({
    todayMeals: [],
    dailySummary: null,
    history: [],
    pendingAnalysis: null,
    isAnalyzing: false,
    isLoading: false,
    error: null,
  });

  // ==================== PUBLIC STATE READS ====================
  
  readonly todayMeals = computed(() => this.state().todayMeals);
  readonly dailySummary = computed(() => this.state().dailySummary);
  readonly history = computed(() => this.state().history);
  readonly pendingAnalysis = computed(() => this.state().pendingAnalysis);
  readonly isAnalyzing = computed(() => this.state().isAnalyzing);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly goals = computed(() => {
    const profile = this.authService.profile();
    if (!profile) return null;
    return {
      calorie_target: profile.calorie_target,
      protein_target_g: profile.protein_target_g,
      carbs_target_g: profile.carbs_target_g,
      fat_target_g: profile.fat_target_g,
      fiber_target_g: profile.fiber_target_g,
      goal_type: profile.goal_type,
      activity_level: profile.activity_level,
      unit_system: profile.unit_system,
      age: profile.age,
      sex: profile.sex,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
    } as NutritionGoals;
  });

  // ==================== COMPUTED VIEWS ====================

  readonly todayTotals = computed(() => {
    const meals = this.state().todayMeals;
    const totals = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugars_g: 0,
      sodium_mg: 0,
    };

    meals.forEach(meal => {
      meal.items?.forEach(item => {
        totals.calories += item.calories;
        totals.protein_g += item.protein_g;
        totals.carbs_g += item.carbs_g;
        totals.fat_g += item.fat_g;
        totals.fiber_g += item.fiber_g;
        totals.sugars_g += item.sugars_g;
        totals.sodium_mg += item.sodium_mg;
      });
    });

    return totals;
  });

  readonly dailyProgress = computed(() => {
    const totals = this.todayTotals();
    const goals = this.goals();
    if (!goals) return null;

    return {
      calories: {
        current: totals.calories,
        target: goals.calorie_target,
        percent: Math.min(100, (totals.calories / goals.calorie_target) * 100),
        remaining: Math.max(0, goals.calorie_target - totals.calories),
      },
      protein: {
        current: totals.protein_g,
        target: goals.protein_target_g,
        percent: Math.min(100, (totals.protein_g / goals.protein_target_g) * 100),
        remaining: Math.max(0, goals.protein_target_g - totals.protein_g),
      },
      carbs: {
        current: totals.carbs_g,
        target: goals.carbs_target_g,
        percent: Math.min(100, (totals.carbs_g / goals.carbs_target_g) * 100),
        remaining: Math.max(0, goals.carbs_target_g - totals.carbs_g),
      },
      fat: {
        current: totals.fat_g,
        target: goals.fat_target_g,
        percent: Math.min(100, (totals.fat_g / goals.fat_target_g) * 100),
        remaining: Math.max(0, goals.fat_target_g - totals.fat_g),
      },
    };
  });

  // ==================== LOAD METHODS ====================

  async loadTodayData(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.loadDayData(today);
  }

  async loadDayData(date: string): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const [mealsResult, summaryResult] = await Promise.all([
        this.api.getMeals(date),
        this.api.getDailySummary(date)
      ]);

      if (mealsResult.error) throw mealsResult.error;
      
      const meals = mealsResult.data || [];
      const summary = summaryResult.data || null;

      if (date === new Date().toISOString().split('T')[0]) {
        this.state.update(s => ({ ...s, todayMeals: meals, dailySummary: summary }));
      } else {
        this.state.update(s => {
          const history = [...s.history];
          const index = history.findIndex(h => h.date === date);
          if (index >= 0) {
            history[index] = { date, summary, meals };
          } else {
            history.push({ date, summary, meals });
          }
          return { ...s, history };
        });
      }
    } catch (error: any) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  // ==================== ACTION METHODS ====================

  async analyzeMeal(request: AnalyzeMealRequest): Promise<boolean> {
    this.setAnalyzing(true);
    this.setError(null);
    this.state.update(s => ({ ...s, pendingAnalysis: null }));

    const response = await this.analysis.analyzeMeal(request);

    if (response.success && response.data) {
      this.state.update(s => ({ ...s, pendingAnalysis: response.data! }));
      this.setAnalyzing(false);
      return true;
    } else {
      this.setError(response.error || 'Failed to analyze meal');
      this.setAnalyzing(false);
      return false;
    }
  }

  async saveMeal(meal: Partial<Meal>, items: MealItem[], imageFile?: File): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    try {
      // 1. Save meal and items
      const { data: savedMeal, error } = await this.api.saveFullMeal(meal, items);
      if (error || !savedMeal) throw error || new Error('Failed to save meal');

      // 2. Upload image if provided
      if (imageFile) {
        const { path, error: uploadError } = await this.api.uploadMealImage(imageFile, savedMeal.id);
        if (uploadError) throw uploadError;
        
        // Update meal with image path
        if (path) {
          await this.api.saveFullMeal({ id: savedMeal.id, image_path: path }, items);
          savedMeal.image_path = path;
        }
      }

      // 3. Update Daily Summary
      await this.recalculateDailySummary(savedMeal.logged_at.split('T')[0]);

      // 4. Update state
      const today = new Date().toISOString().split('T')[0];
      if (savedMeal.logged_at.startsWith(today)) {
        await this.loadTodayData();
      }

      this.state.update(s => ({ ...s, pendingAnalysis: null }));
      return true;
    } catch (error: any) {
      this.setError(error.message);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  async deleteMeal(mealId: string, loggedAt: string): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    try {
      const { error } = await this.api.deleteMeal(mealId);
      if (error) throw error;

      await this.recalculateDailySummary(loggedAt.split('T')[0]);
      
      const today = new Date().toISOString().split('T')[0];
      if (loggedAt.startsWith(today)) {
        await this.loadTodayData();
      }

      return true;
    } catch (error: any) {
      this.setError(error.message);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  async recalculateDailySummary(date: string): Promise<void> {
    const { data: meals, error } = await this.api.getMeals(date);
    if (error || !meals) return;

    const totals = {
      calories_total: 0,
      protein_total_g: 0,
      carbs_total_g: 0,
      fat_total_g: 0,
      fiber_total_g: 0,
      sugars_total_g: 0,
      sodium_total_mg: 0,
      meal_count: meals.length,
    };

    meals.forEach(meal => {
      meal.items?.forEach(item => {
        totals.calories_total += item.calories;
        totals.protein_total_g += item.protein_g;
        totals.carbs_total_g += item.carbs_g;
        totals.fat_total_g += item.fat_g;
        totals.fiber_total_g += item.fiber_g;
        totals.sugars_total_g += item.sugars_g;
        totals.sodium_total_mg += item.sodium_mg;
      });
    });

    await this.api.upsertDailySummary({
      summary_date: date,
      ...totals
    });
  }

  // ==================== STATE HELPERS ====================

  setPendingAnalysis(analysis: MealAnalysis | null): void {
    this.state.update(s => ({ ...s, pendingAnalysis: analysis }));
  }

  private setLoading(loading: boolean): void {
    this.state.update(s => ({ ...s, isLoading: loading }));
  }

  private setAnalyzing(analyzing: boolean): void {
    this.state.update(s => ({ ...s, isAnalyzing: analyzing }));
  }

  private setError(error: string | null): void {
    this.state.update(s => ({ ...s, error }));
  }
}
