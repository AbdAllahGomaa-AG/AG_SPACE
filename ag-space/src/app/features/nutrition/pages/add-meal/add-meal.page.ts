import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NutritionFacade } from '../../services/nutrition.facade';
import { MealInputComponent } from '../../components/meal-input/meal-input.component';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-add-meal',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MealInputComponent, 
    ButtonModule, 
    ProgressSpinnerModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './add-meal.page.html',
  styleUrl: './add-meal.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddMealPage {
  private readonly facade = inject(NutritionFacade);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly isAnalyzing = this.facade.isAnalyzing;

  async onAnalyze(event: { text?: string, file?: File }): Promise<void> {
    let imageBase64: string | undefined;
    let mimeType: string | undefined;

    if (event.file) {
      imageBase64 = await this.fileToBase64(event.file);
      mimeType = event.file.type;
    }

    const success = await this.facade.analyzeMeal({
      textDescription: event.text,
      imageBase64: imageBase64?.split(',')[1], // Remove metadata prefix
      mimeType: mimeType
    });

    if (success) {
      // Store the file temporarily in the facade if we want to upload it later
      // But for now, we just navigate to review
      this.router.navigate(['/nutrition/review'], { 
        state: { imageFile: event.file } 
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Analysis Failed',
        detail: this.facade.error() || 'Could not analyze meal. Please try again.'
      });
    }
  }

  onManualEntry(): void {
    // Set an empty pending analysis and bypass AI
    this.facade.setPendingAnalysis({
      meal_name: 'Custom Meal',
      items: [],
      totals: {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugars_g: 0,
        sodium_mg: 0
      },
      analysis_confidence: 100,
      assumptions: ['Manual Entry'],
      clarifying_question: null
    });
    this.router.navigate(['/nutrition/review']);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}
