import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom, timeout, filter } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    try {
      await firstValueFrom(
        toObservable(authService.isLoading).pipe(
          filter((loading) => !loading),
          timeout(10000)
        )
      );
    } catch (error) {
      console.error('Auth initialization timeout:', error);
    }
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
