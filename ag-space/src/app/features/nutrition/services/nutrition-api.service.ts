import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../../core/supabase/supabase-client.service';
import { AuthService } from '../../../core/auth/auth.service';
import { RequestLoggerService } from '../../../core/http/request-logger.service';
import { Meal, MealItem, DailySummary } from '../models/meal.model';
import { NutritionGoals } from '../models/nutrition-goal.model';

@Injectable({
  providedIn: 'root',
})
export class NutritionApiService {
  private readonly supabaseClient = inject(SupabaseClientService);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(RequestLoggerService);

  private requireUser(): { userId: string; logId: string } | null {
    const logId = this.logger.start('NutritionApiService', 'GUARD', 'auth check');
    const user = this.authService.user();
    if (!user) {
      this.logger.skip(logId, 'User not authenticated — authService.user() is null');
      console.warn('[NutritionApiService] Request blocked: no authenticated user');
      return null;
    }
    this.logger.complete(logId);
    return { userId: user.id, logId };
  }

  private async executeQuery<T>(
    methodName: string,
    queryFn: () => Promise<{ data: T | null; error: any }>,
  ): Promise<{ data: T | null; error: Error | null }> {
    const logId = this.logger.start('NutritionApiService', methodName, 'supabase');
    try {
      const result = await queryFn();
      if (result.error) {
        this.logger.fail(logId, result.error.message || String(result.error));
        return { data: null, error: result.error instanceof Error ? result.error : new Error(result.error.message || String(result.error)) };
      }
      this.logger.complete(logId);
      return { data: result.data, error: null };
    } catch (err: any) {
      this.logger.fail(logId, err?.message || String(err));
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getMeals(date: string): Promise<{ data: Meal[] | null; error: Error | null }> {
    return this.executeQuery('getMeals', async () => {
      const client = this.supabaseClient.getClient();
      return await client
        .from('meals')
        .select('*, items:meal_items(*)')
        .gte('logged_at', `${date}T00:00:00`)
        .lte('logged_at', `${date}T23:59:59`)
        .order('logged_at', { ascending: true });
    });
  }

  async saveFullMeal(meal: Partial<Meal>, items: MealItem[]): Promise<{ data: Meal | null; error: Error | null }> {
    const guard = this.requireUser();
    if (!guard) return { data: null, error: new Error('User not authenticated') };

    try {
      const client = this.supabaseClient.getClient();

      const mealPayload = {
        ...meal,
        user_id: guard.userId,
        updated_at: new Date().toISOString(),
      };

      let mealResult;
      if (meal.id) {
        mealResult = await client
          .from('meals')
          .update(mealPayload)
          .eq('id', meal.id)
          .select()
          .single();
      } else {
        mealResult = await client
          .from('meals')
          .insert(mealPayload)
          .select()
          .single();
      }

      if (mealResult.error) return { data: null, error: mealResult.error };

      const savedMeal = mealResult.data;

      if (meal.id) {
        const { error: deleteError } = await client
          .from('meal_items')
          .delete()
          .eq('meal_id', meal.id);
        if (deleteError) return { data: null, error: deleteError };
      }

      const itemsPayload = items.map(item => ({
        ...item,
        meal_id: savedMeal.id,
      }));

      const { data: savedItems, error: itemsError } = await client
        .from('meal_items')
        .insert(itemsPayload)
        .select();

      if (itemsError) return { data: null, error: itemsError };

      return { data: { ...savedMeal, items: savedItems }, error: null };
    } catch (err: any) {
      console.error('[NutritionApiService] saveFullMeal error:', err);
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async deleteMeal(mealId: string): Promise<{ error: Error | null }> {
    const result = await this.executeQuery('deleteMeal', async () => {
      const client = this.supabaseClient.getClient();
      return await client
        .from('meals')
        .delete()
        .eq('id', mealId);
    });
    return { error: result.error };
  }

  async getDailySummary(date: string): Promise<{ data: DailySummary | null; error: Error | null }> {
    return this.executeQuery('getDailySummary', async () => {
      const client = this.supabaseClient.getClient();
      return await client
        .from('daily_summaries')
        .select('*')
        .eq('summary_date', date)
        .single();
    });
  }

  async upsertDailySummary(summary: Partial<DailySummary>): Promise<{ data: DailySummary | null; error: Error | null }> {
    const guard = this.requireUser();
    if (!guard) return { data: null, error: new Error('User not authenticated') };

    return this.executeQuery('upsertDailySummary', async () => {
      const client = this.supabaseClient.getClient();
      return await client
        .from('daily_summaries')
        .upsert({
          ...summary,
          user_id: guard.userId,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
    });
  }

  async uploadMealImage(file: File, mealId: string): Promise<{ path: string | null; error: Error | null }> {
    const guard = this.requireUser();
    if (!guard) return { path: null, error: new Error('User not authenticated') };

    const logId = this.logger.start('NutritionApiService', 'uploadMealImage', 'supabase/storage');
    try {
      const client = this.supabaseClient.getClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${guard.userId}/${mealId}/${fileName}`;

      const { data, error } = await client.storage
        .from('meal-images')
        .upload(filePath, file);

      if (error) {
        this.logger.fail(logId, error.message);
        return { path: null, error: error instanceof Error ? error : new Error(String(error)) };
      }
      this.logger.complete(logId);
      return { path: data?.path || null, error: null };
    } catch (err: any) {
      this.logger.fail(logId, err?.message || String(err));
      return { path: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getMealImageUrl(path: string): Promise<string> {
    const client = this.supabaseClient.getClient();
    const { data } = client.storage
      .from('meal-images')
      .getPublicUrl(path);
    return data.publicUrl;
  }
}
