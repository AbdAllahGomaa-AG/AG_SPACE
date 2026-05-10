import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { RequestLoggerService } from './app/core/http/request-logger.service';
import { setupDiagnostics } from './app/core/http/diagnostics';

bootstrapApplication(App, appConfig)
  .then((appRef) => {
    // Set up browser console diagnostics (only in non-production or always for debugging)
    const logger = appRef.injector.get(RequestLoggerService);
    setupDiagnostics(logger);
  })
  .catch((err) => console.error(err));
