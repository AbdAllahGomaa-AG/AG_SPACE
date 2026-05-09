export type GoalType = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type UnitSystem = 'metric' | 'imperial';

export interface NutritionGoals {
  calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  fiber_target_g: number;
  goal_type: GoalType;
  activity_level: ActivityLevel;
  unit_system: UnitSystem;
  age?: number;
  sex?: 'male' | 'female' | 'other';
  height_cm?: number;
  weight_kg?: number;
}
