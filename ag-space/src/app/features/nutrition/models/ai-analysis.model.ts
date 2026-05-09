import { MealItem } from './meal.model';

export interface MealAnalysis {
  meal_name: string;
  items: MealItem[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugars_g: number;
    sodium_mg: number;
  };
  analysis_confidence: number;
  assumptions: string[];
  clarifying_question: string | null;
}

export interface AnalyzeMealRequest {
  imageBase64?: string;
  mimeType?: string;
  textDescription?: string;
  mealType?: string;
}

export interface AnalyzeMealResponse {
  success: boolean;
  data?: MealAnalysis;
  error?: string;
}
