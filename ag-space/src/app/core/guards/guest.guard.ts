import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom, filter } from 'rxjs';

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth initialization to complete
  if (!authService.isAuthInitialized()) {
    await firstValueFrom(
      toObservable(authService.isAuthInitialized).pipe(
        filter((initialized) => initialized)
      )
    );
  }

  // If not authenticated, allow access to guest routes (login, etc.)
  if (!authService.isAuthenticated()) {
    return true;
  }

  // Already authenticated - redirect to home
  return router.createUrlTree(['/']);
};
