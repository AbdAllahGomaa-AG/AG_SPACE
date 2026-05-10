import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom, filter, race, timer, throwError, switchMap } from 'rxjs';

const AUTH_TIMEOUT_MS = 10_000;

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthInitialized()) {
    try {
      await firstValueFrom(
        race(
          toObservable(authService.isAuthInitialized).pipe(
            filter((initialized) => initialized)
          ),
          timer(AUTH_TIMEOUT_MS).pipe(
            switchMap(() => throwError(() => new Error(`Auth init timed out after ${AUTH_TIMEOUT_MS}ms`)))
          )
        )
      );
    } catch (err) {
      console.error('[AuthGuard] Auth init failed or timed out — redirecting to login', err);
      return router.createUrlTree(['/login']);
    }
  }

  // Check authentication status
  if (authService.isAuthenticated()) {
    return true;
  }

  console.warn('[AuthGuard] User not authenticated — redirecting to login');
  // Not authenticated - redirect to login
  return router.createUrlTree(['/login']);
};
