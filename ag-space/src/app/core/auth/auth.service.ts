import { Injectable, inject, signal, computed, PLATFORM_ID, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { Profile } from './profile.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabaseClient = inject(SupabaseClientService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly user = signal<User | null>(null);
  readonly session = signal<Session | null>(null);
  readonly profile = signal<Profile | null>(null);
  readonly isLoading = signal(true);
  readonly isAuthInitialized = signal(false);
  readonly isAuthenticated = computed(() => !!this.user());
  /** Diagnostic: tracks how many failures occurred during auth init */
  readonly authInitFailures = signal(0);
  /** Diagnostic: store last error message for debugging */
  readonly lastAuthError = signal<string | null>(null);

  private authSubscription: { unsubscribe: () => void } | null = null;
  private initAttempted = false;

  constructor() {
    const isBrowser = isPlatformBrowser(this.platformId);

    if (isBrowser) {
      console.log('[AuthService] Running in browser — initializing auth');
      this.initializeAuth().then(() => {
        // After client-side init, schedule a re-check via afterNextRender
        // This handles the SSR hydration case where window was unavailable
        afterNextRender({
          write: () => {
            if (!this.user() && this.initAttempted) {
              console.log('[AuthService] afterNextRender: re-initializing auth (SSR recovery)');
              this.initAttempted = false;
              this.initializeAuth();
            }
          }
        });
      });
    } else {
      console.log('[AuthService] Running in SSR — attempting auth init (will fail gracefully)');
      // On SSR, initializeAuth will crash on window.localStorage but we catch it
      // and set isAuthInitialized = true so the auth guard doesn't hang
      this.initializeAuth().catch(() => {
        console.log('[AuthService] SSR auth init failed (expected) — allowing auth guard to proceed');
      });
    }
  }

  private async initializeAuth(): Promise<void> {
    // Prevent double initialization
    if (this.initAttempted) {
      console.log('[AuthService] Skipping duplicate init attempt');
      return;
    }
    this.initAttempted = true;

    console.log('[AuthService] initializeAuth() STARTED', {
      hasExistingSession: !!this.session(),
      hasExistingUser: !!this.user(),
    });

    try {
      const client = this.supabaseClient.getClient();

      console.log('[AuthService] Fetching session...');
      const { data: { session } } = await client.auth.getSession();

      console.log('[AuthService] Session result:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      });

      if (session) {
        this.session.set(session);
        this.user.set(session.user);
        console.log('[AuthService] Session restored. User:', session.user.email);
        await this.loadProfile(session.user.id);
      } else {
        console.log('[AuthService] No session found in storage');
      }

      // Track previous auth state to detect unexpected sign-outs
      let wasAuthenticated = !!this.user();

      this.authSubscription = client.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (event === 'INITIAL_SESSION') return;

          console.log('[AuthService] onAuthStateChange:', { event, hasSession: !!session, wasAuthenticated });

          this.session.set(session);
          this.user.set(session?.user ?? null);

          // Detect unexpected sign-out (user was authenticated but now is not)
          if (wasAuthenticated && !session) {
            console.warn('[AuthService] UNEXPECTED SIGN-OUT DETECTED:', event);
            console.warn('[AuthService] This is likely due to token refresh failure.');
            console.warn('[AuthService] All API calls that check user() will now be skipped.');
            // Optional: could redirect to login here
          }
          wasAuthenticated = !!session;

          if (session?.user) {
            await this.loadProfile(session.user.id);
          } else {
            this.profile.set(null);
          }
        }
      ).data.subscription;

      this.isAuthInitialized.set(true);
      this.isLoading.set(false);
      console.log('[AuthService] initializeAuth() COMPLETED successfully');

    } catch (error: any) {
      this.authInitFailures.update(c => c + 1);
      this.lastAuthError.set(error?.message || String(error));
      console.error('[AuthService] initializeAuth() FAILED:', error?.message || error);

      // CRITICAL: When SSR catches an error, isAuthInitialized stays false
      // so the auth guard waits. This will trigger a retry via afterNextRender.
      // On the client, if we get here, the auth guard will also wait.
      if (isPlatformBrowser(this.platformId)) {
        // Still mark initialized so the app doesn't hang forever
        this.isAuthInitialized.set(true);
        this.isLoading.set(false);

        // Try one more time after a brief delay (handles race conditions)
        setTimeout(() => {
          this.initAttempted = false;
          this.initializeAuth();
        }, 1000);
      } else {
        // On server, do NOT mark as initialized — let the client retry
        this.isLoading.set(false);
      }
    }
  }

  async loadProfile(userId: string): Promise<void> {
    console.log('[AuthService] loadProfile() for user:', userId);
    try {
      const client = this.supabaseClient.getClient();
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('[AuthService] Profile not found:', error.message);
        this.profile.set(null);
        return;
      }

      this.profile.set(data as Profile);
      console.log('[AuthService] Profile loaded:', (data as Profile).full_name);
    } catch (error: any) {
      console.error('[AuthService] loadProfile() error:', error?.message || error);
      this.profile.set(null);
    }
  }

  async updateProfile(updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> {
    const userBefore = this.user();

    try {
      const user = this.user();
      if (!user) {
        console.warn('[AuthService] updateProfile() - no user');
        throw new Error('User not authenticated');
      }

      const client = this.supabaseClient.getClient();
      const { data, error } = await client
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      this.profile.set(data as Profile);
      console.log('[AuthService] Profile updated');
      return { success: true };
    } catch (error: any) {
      console.error('[AuthService] updateProfile() error:', error?.message || error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    console.log('[AuthService] signIn() for:', email);
    try {
      this.isLoading.set(true);
      const client = this.supabaseClient.getClient();

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.isLoading.set(false);
        console.warn('[AuthService] signIn() failed:', error.message);
        return { success: false, error: this.getErrorMessage(error.message) };
      }

      this.session.set(data.session);
      this.user.set(data.user ?? null);

      if (data.user) {
        await this.loadProfile(data.user.id);
      }

      this.isLoading.set(false);
      console.log('[AuthService] signIn() succeeded for:', data.user?.email);
      return { success: true };
    } catch (error) {
      this.isLoading.set(false);
      console.error('[AuthService] signIn() threw:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signOut(): Promise<void> {
    console.log('[AuthService] signOut()');
    try {
      const client = this.supabaseClient.getClient();
      await client.auth.signOut();

      this.session.set(null);
      this.user.set(null);
      this.profile.set(null);

      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('[AuthService] signOut() error:', error);
      this.session.set(null);
      this.user.set(null);
      this.profile.set(null);
      await this.router.navigate(['/login']);
    }
  }

  private getErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please verify your email address',
      'User not found': 'No account found with this email',
    };

    return errorMap[error] || error;
  }

  ngOnDestroy(): void {
    console.log('[AuthService] ngOnDestroy()');
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
