import { Injectable } from '@angular/core';

export interface RequestLogEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status: 'pending' | 'success' | 'error' | 'skipped';
  duration?: number;
  error?: string;
  reason?: string;
  source: string;
}

@Injectable({
  providedIn: 'root',
})
export class RequestLoggerService {
  private readonly logs = new Map<string, RequestLogEntry>();
  private readonly MAX_LOG_ENTRIES = 500;
  private requestCount = 0;
  private skipCount = 0;

  /** Log a request start */
  start(source: string, method: string, url: string): string {
    const id = `${Date.now().toString(36)}-${(this.requestCount++).toString(36)}`;
    const entry: RequestLogEntry = {
      id,
      timestamp: Date.now(),
      method,
      url,
      status: 'pending',
      source,
    };
    this.logs.set(id, entry);
    this.prune();
    console.log(`[REQ:${id}] START ${method} ${url} (source: ${source})`);
    return id;
  }

  /** Mark a request as completed successfully */
  complete(id: string): void {
    const entry = this.logs.get(id);
    if (!entry) return;
    entry.status = 'success';
    entry.duration = Date.now() - entry.timestamp;
    console.log(`[REQ:${id}] SUCCESS (${entry.duration}ms)`);
  }

  /** Mark a request as failed */
  fail(id: string, error: string): void {
    const entry = this.logs.get(id);
    if (!entry) return;
    entry.status = 'error';
    entry.duration = Date.now() - entry.timestamp;
    entry.error = error;
    console.error(`[REQ:${id}] FAILED (${entry.duration}ms): ${error}`);
  }

  /** Mark a request as skipped (never sent to network) */
  skip(id: string, reason: string): void {
    const entry = this.logs.get(id);
    if (!entry) return;
    entry.status = 'skipped';
    entry.reason = reason;
    this.skipCount++;
    console.warn(`[REQ:${id}] SKIPPED: ${reason}`);
  }

  /** Get all recent log entries */
  getRecentLogs(count = 50): RequestLogEntry[] {
    return Array.from(this.logs.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  /** Get skipped requests (never reached network) */
  getSkippedRequests(): RequestLogEntry[] {
    return Array.from(this.logs.values())
      .filter(e => e.status === 'skipped')
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /** Get skip statistics */
  getSkipStats(): { total: number; skipped: number; ratio: string } {
    return {
      total: this.requestCount,
      skipped: this.skipCount,
      ratio: this.requestCount > 0 ? `${((this.skipCount / this.requestCount) * 100).toFixed(1)}%` : '0%',
    };
  }

  /** Expose the full log for debugging */
  getFullLog(): RequestLogEntry[] {
    return Array.from(this.logs.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  private prune(): void {
    if (this.logs.size > this.MAX_LOG_ENTRIES) {
      const entries = Array.from(this.logs.entries());
      const toDelete = entries.slice(0, entries.length - this.MAX_LOG_ENTRIES);
      toDelete.forEach(([key]) => this.logs.delete(key));
    }
  }
}
