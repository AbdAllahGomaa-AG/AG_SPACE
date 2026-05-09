export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
export type InputMode = 'image' | 'text';

export interface Meal {
  id: string;
  user_id: string;
  meal_name: string;
  meal_type: MealType;
  logged_at: string;
  input_mode: InputMode;
  source_text?: string;
  image_path?: string;
  analysis_confidence?: number;
  assumptions_json?: string[];
  ai_raw_response_json?: any;
  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
  items?: MealItem[];
}

export interface MealItem {
  id?: string;
  meal_id?: string;
  name: string;
  estimated_quantity?: string;
  estimated_weight_grams?: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugars_g: number;
  sodium_mg: number;
  created_at?: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  summary_date: string;
  calories_total: number;
  protein_total_g: number;
  carbs_total_g: number;
  fat_total_g: number;
  fiber_total_g: number;
  sugars_total_g: number;
  sodium_total_mg: number;
  meal_count: number;
  updated_at: string;
}
