import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        console.error('[HTTP] Network/CORS error:', {
          url: error.url,
          message: error.message,
          online: navigator.onLine,
        });
      }
      return throwError(() => error);
    })
  );
};
