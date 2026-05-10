import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom, filter, race, timer, throwError, switchMap } from 'rxjs';

const AUTH_TIMEOUT_MS = 10_000;

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth initialization to complete (with timeout)
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
      console.warn('[GuestGuard] Auth init failed or timed out — allowing guest access', err);
      return true;
    }
  }

  // If not authenticated, allow access to guest routes (login, etc.)
  if (!authService.isAuthenticated()) {
    return true;
  }

  // Already authenticated - redirect to home
  return router.createUrlTree(['/']);
};
