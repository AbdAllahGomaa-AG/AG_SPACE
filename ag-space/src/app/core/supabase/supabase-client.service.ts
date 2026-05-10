import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseClientService {
  private readonly platformId = inject(PLATFORM_ID);
  private client: SupabaseClient | null = null;
  /** Diagnostic: tracks how many times getClient() was called */
  private initAttempts = 0;

  getClient(): SupabaseClient {
    this.initAttempts++;
    const isBrowser = isPlatformBrowser(this.platformId);

    if (!this.client) {
      const { url, publishableKey } = environment.supabase;

      if (!url || !publishableKey || url === 'YOUR_SUPABASE_URL') {
        console.error('[SupabaseClient] Configuration missing', { url, keyExists: !!publishableKey });
        throw new Error('Supabase configuration is missing');
      }

      if (!isBrowser) {
        console.warn('[SupabaseClient] SSR: creating noop client (window unavailable)');
        this.client = null!;
        throw new Error('Supabase client not available in server environment');
      }

      console.log('[SupabaseClient] Creating client (attempt #' + this.initAttempts + ')');

      this.client = createClient(url, publishableKey, {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    }

    return this.client;
  }

  /** Diagnostic: returns whether supabase client has been created */
  hasClient(): boolean {
    return this.client !== null;
  }
}
