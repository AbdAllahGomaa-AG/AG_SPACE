import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../../core/supabase/supabase-client.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Meal, MealItem, DailySummary } from '../models/meal.model';
import { NutritionGoals } from '../models/nutrition-goal.model';

@Injectable({
  providedIn: 'root',
})
export class NutritionApiService {
  private readonly supabaseClient = inject(SupabaseClientService);
  private readonly authService = inject(AuthService);

  async getMeals(date: string): Promise<{ data: Meal[] | null; error: any }> {
    const client = this.supabaseClient.getClient();
    const { data, error } = await client
      .from('meals')
      .select('*, items:meal_items(*)')
      .gte('logged_at', `${date}T00:00:00`)
      .lte('logged_at', `${date}T23:59:59`)
      .order('logged_at', { ascending: true });

    return { data, error };
  }

  async saveFullMeal(meal: Partial<Meal>, items: MealItem[]): Promise<{ data: Meal | null; error: any }> {
    const client = this.supabaseClient.getClient();
    const user = this.authService.user();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // 1. Insert/Update Meal
    const mealPayload = {
      ...meal,
      user_id: user.id,
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

    // 2. Delete existing items if updating
    if (meal.id) {
      const { error: deleteError } = await client
        .from('meal_items')
        .delete()
        .eq('meal_id', meal.id);
      
      if (deleteError) return { data: null, error: deleteError };
    }

    // 3. Insert Items
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
  }

  async deleteMeal(mealId: string): Promise<{ error: any }> {
    const client = this.supabaseClient.getClient();
    const { error } = await client
      .from('meals')
      .delete()
      .eq('id', mealId);

    return { error };
  }

  async getDailySummary(date: string): Promise<{ data: DailySummary | null; error: any }> {
    const client = this.supabaseClient.getClient();
    const { data, error } = await client
      .from('daily_summaries')
      .select('*')
      .eq('summary_date', date)
      .single();

    return { data, error };
  }

  async upsertDailySummary(summary: Partial<DailySummary>): Promise<{ data: DailySummary | null; error: any }> {
    const client = this.supabaseClient.getClient();
    const user = this.authService.user();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await client
      .from('daily_summaries')
      .upsert({
        ...summary,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  }

  async uploadMealImage(file: File, mealId: string): Promise<{ path: string | null; error: any }> {
    const client = this.supabaseClient.getClient();
    const user = this.authService.user();

    if (!user) {
      return { path: null, error: new Error('User not authenticated') };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${mealId}/${fileName}`;

    const { data, error } = await client.storage
      .from('meal-images')
      .upload(filePath, file);

    return { path: data?.path || null, error };
  }

  async getMealImageUrl(path: string): Promise<string> {
    const client = this.supabaseClient.getClient();
    const { data } = client.storage
      .from('meal-images')
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
}
