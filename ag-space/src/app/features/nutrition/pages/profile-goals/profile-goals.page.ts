import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { NutritionGoals, GoalType, ActivityLevel, UnitSystem } from '../../models/nutrition-goal.model';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-profile-goals',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './profile-goals.page.html',
  styleUrl: './profile-goals.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileGoalsPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  goals = signal<NutritionGoals>({
    calorie_target: 2000,
    protein_target_g: 150,
    carbs_target_g: 250,
    fat_target_g: 65,
    fiber_target_g: 25,
    goal_type: 'maintain',
    activity_level: 'moderate',
    unit_system: 'metric'
  });

  readonly goalTypes = [
    { label: 'Lose Weight', value: 'lose' },
    { label: 'Maintain Weight', value: 'maintain' },
    { label: 'Gain Weight', value: 'gain' }
  ];

  readonly activityLevels = [
    { label: 'Sedentary', value: 'sedentary' },
    { label: 'Light', value: 'light' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'Active', value: 'active' },
    { label: 'Very Active', value: 'very_active' }
  ];

  ngOnInit(): void {
    const profile = this.authService.profile();
    if (profile) {
      this.goals.set({
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
      });
    }
  }

  async onSave(): Promise<void> {
    const success = await this.authService.updateProfile(this.goals() as any);
    if (success) {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Nutrition goals updated' });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update goals' });
    }
  }

  calculateTargets(): void {
    // Basic BMR calculation (Mifflin-St Jeor Equation)
    const g = this.goals();
    if (!g.weight_kg || !g.height_cm || !g.age || !g.sex) {
      this.messageService.add({ severity: 'warn', summary: 'Missing Info', detail: 'Please fill in age, sex, weight, and height for auto-calculation.' });
      return;
    }

    let bmr = 10 * g.weight_kg + 6.25 * g.height_cm - 5 * g.age;
    bmr = g.sex === 'male' ? bmr + 5 : bmr - 161;

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    let tdee = bmr * activityMultipliers[g.activity_level];

    if (g.goal_type === 'lose') tdee -= 500;
    if (g.goal_type === 'gain') tdee += 500;

    const calories = Math.round(tdee);
    const protein = Math.round(g.weight_kg * 2); // 2g per kg
    const fat = Math.round((calories * 0.25) / 9); // 25% of calories
    const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4);

    this.goals.update(current => ({
      ...current,
      calorie_target: calories,
      protein_target_g: protein,
      carbs_target_g: carbs,
      fat_target_g: fat,
      fiber_target_g: 25
    }));
    
    this.messageService.add({ severity: 'info', summary: 'Calculated', detail: 'Targets estimated based on your profile.' });
  }
}
