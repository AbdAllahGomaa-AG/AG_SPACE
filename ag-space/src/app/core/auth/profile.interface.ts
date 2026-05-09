export interface Profile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  // Nutrition Targets
  calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  fiber_target_g: number;
  // Profile Details
  goal_type: 'lose' | 'maintain' | 'gain';
  age?: number;
  sex?: 'male' | 'female' | 'other';
  height_cm?: number;
  weight_kg?: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  unit_system: 'metric' | 'imperial';
  updated_at?: string;
}
