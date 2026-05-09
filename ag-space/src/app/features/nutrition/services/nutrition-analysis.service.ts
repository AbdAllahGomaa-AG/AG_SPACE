import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { AnalyzeMealRequest, AnalyzeMealResponse } from '../models/ai-analysis.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NutritionAnalysisService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly functionsUrl = environment.supabase.functionsUrl;

  async analyzeMeal(request: AnalyzeMealRequest): Promise<AnalyzeMealResponse> {
    const session = this.authService.session();
    if (!session) {
      return { success: false, error: 'User not authenticated' };
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    });

    try {
      const response = await firstValueFrom(
        this.http.post<AnalyzeMealResponse>(
          `${this.functionsUrl}/analyze-meal`,
          request,
          { headers }
        )
      );
      return response;
    } catch (error: any) {
      console.error('Error analyzing meal:', error);
      return {
        success: false,
        error: error.error?.error || error.message || 'An unexpected error occurred during analysis',
      };
    }
  }
}
