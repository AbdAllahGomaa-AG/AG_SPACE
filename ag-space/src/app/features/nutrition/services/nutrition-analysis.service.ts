import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, timeout, retry, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { AnalyzeMealRequest, AnalyzeMealResponse } from '../models/ai-analysis.model';
import { firstValueFrom } from 'rxjs';

const REQUEST_TIMEOUT_MS = 35_000;
const MAX_RETRIES = 1;

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
      console.warn('[NutritionAnalysisService] No active session');
      return { success: false, error: 'Please sign in to analyze meals' };
    }

    if (!request.textDescription && !request.imageBase64) {
      return { success: false, error: 'Provide a meal description or photo' };
    }

    try {
      const response = await firstValueFrom(
        this.http.post<AnalyzeMealResponse>(
          `${this.functionsUrl}/analyze-meal`,
          request,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        ).pipe(
          timeout(REQUEST_TIMEOUT_MS),
          retry(MAX_RETRIES),
          catchError((err: HttpErrorResponse) => this.handleHttpError(err))
        )
      );
      return response;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'An unexpected error occurred during analysis';
      console.error('[NutritionAnalysisService] analyzeMeal failed:', msg);
      return { success: false, error: msg };
    }
  }

  private handleHttpError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 0) {
      const message = navigator.onLine === false
        ? 'No internet connection. Please check your network.'
        : 'Unable to reach the analysis service. This may be due to a network issue or the service being temporarily unavailable.';
      return throwError(() => new Error(message));
    }

    if (error.status === 413) {
      return throwError(() => new Error('Image is too large. Please use a smaller image or reduce its resolution.'));
    }

    if (error.status === 401) {
      return throwError(() => new Error('Your session has expired. Please sign in again.'));
    }

    if (error.status === 504) {
      return throwError(() => new Error('Analysis took too long. Please try again or use a simpler meal description.'));
    }

    if (error.status === 429) {
      return throwError(() => new Error('AI service is currently busy. Please wait a moment and try again.'));
    }

    const serverMsg = error.error?.error || error.error?.message;
    if (serverMsg) {
      return throwError(() => new Error(serverMsg));
    }

    if (error.status >= 500) {
      return throwError(() => new Error('The analysis service encountered an error. Please try again later.'));
    }

    return throwError(() => new Error('An unexpected error occurred during analysis'));
  }
}
