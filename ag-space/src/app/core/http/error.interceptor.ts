import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const requestId = crypto.randomUUID?.() ?? Date.now().toString(36);
  const startTime = performance.now();

  console.groupCollapsed(`[HTTP:${requestId}] ${req.method} ${req.url}`);

  // Log request headers (without sensitive data)
  const safeHeaders: Record<string, string> = {};
  req.headers.keys().forEach(key => {
    safeHeaders[key] = key.toLowerCase() === 'authorization' ? 'Bearer [REDACTED]' : req.headers.get(key) ?? '';
  });

  console.log('Request headers:', safeHeaders);
  console.log('Request body:', req.body);
  console.log('navigator.onLine:', navigator.onLine);

  console.groupEnd();

  return next(req).pipe(
    tap({
      next: (event: any) => {
        // Only log the response event (not progress events)
        if (event.type === 4) {
          const elapsed = (performance.now() - startTime).toFixed(1);
          console.log(`[HTTP:${requestId}] Response after ${elapsed}ms:`, {
            status: event.status,
            statusText: event.statusText,
          });
        }
      },
    }),
    catchError((error: HttpErrorResponse) => {
      const elapsed = (performance.now() - startTime).toFixed(1);
      console.error(`[HTTP:${requestId}] Error after ${elapsed}ms:`, {
        url: error.url,
        status: error.status,
        message: error.message,
        online: navigator.onLine,
        error: error.error,
      });

      if (error.status === 0) {
        console.error('[HTTP] Network/CORS error — request never reached server', {
          url: error.url,
          message: error.message,
          online: navigator.onLine,
          cause: navigator.onLine === false
            ? 'Browser offline'
            : 'Possible CORS, DNS failure, or request blocked',
        });
      }

      return throwError(() => error);
    })
  );
};
