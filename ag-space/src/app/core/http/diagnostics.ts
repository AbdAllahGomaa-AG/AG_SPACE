import { RequestLoggerService } from './request-logger.service';

/**
 * Global diagnostics object exposed on `window.__AG_DEBUG__` for browser console debugging.
 *
 * Usage in browser console:
 *   await __AG_DEBUG__.requests()           // View recent request log
 *   await __AG_DEBUG__.skipped()            // View skipped requests (never reached network)
 *   await __AG_DEBUG__.stats()              // View skip/total request stats
 *   await __AG_DEBUG__.auth()               // View auth service state
 *   await __AG_DEBUG__.health()             // Full diagnostic summary
 *   await __AG_DEBUG__.retrySkipped()       // Retry the last skipped request (idea: triggers re-fetch)
 */
export function setupDiagnostics(logger: RequestLoggerService): void {
  if (typeof window === 'undefined') return;

  const AG_DEBUG = {
    requests: () => {
      console.table(logger.getFullLog().slice(0, 50));
      return logger.getFullLog().slice(0, 50);
    },

    skipped: () => {
      const skipped = logger.getSkippedRequests();
      console.warn(`[AG_DEBUG] ${skipped.length} skipped requests (never reached network):`);
      console.table(skipped);
      return skipped;
    },

    stats: () => {
      const stats = logger.getSkipStats();
      console.log(`[AG_DEBUG] Request Stats:`, stats);
      return stats;
    },

    auth: () => {
      console.log('[AG_DEBUG] Auth diagnostics:', {
        hint: 'Open Angular DevTools (ng devtools) and inspect AuthService provider',
      });
      return {
        note: 'Inspect AuthService via Angular DevTools or check window.__AG_DEBUG__.health()',
      };
    },

    health: () => {
      const stats = logger.getSkipStats();
      const skipped = logger.getSkippedRequests();
      const recent = logger.getRecentLogs(20);
      return {
        timestamp: new Date().toISOString(),
        requestStats: stats,
        recentRequests: recent,
        skippedRequests: skipped,
      };
    },
  };

  (window as any).__AG_DEBUG__ = AG_DEBUG;
  console.log('[AG_DEBUG] Diagnostics available via window.__AG_DEBUG__');
  console.log('[AG_DEBUG] Run `await __AG_DEBUG__.health()` to view full diagnostics');
}
