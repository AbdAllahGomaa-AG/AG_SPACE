import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseClientService {
  private client: SupabaseClient | null = null;

  getClient(): SupabaseClient {
    if (!this.client) {
      const { url, publishableKey } = environment.supabase;

      if (!url || !publishableKey || url === 'YOUR_SUPABASE_URL') {
        console.error('Supabase configuration is missing. Please set supabase.url and supabase.publishableKey in environment files.');
        throw new Error('Supabase configuration is missing');
      }

      this.client = createClient(url, publishableKey, {
        auth: {
          storage: window.localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    }

    return this.client;
  }
}
