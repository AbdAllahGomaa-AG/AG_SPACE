import { Injectable, inject, signal, computed } from '@angular/core';
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

  readonly user = signal<User | null>(null);
  readonly session = signal<Session | null>(null);
  readonly profile = signal<Profile | null>(null);
  readonly isLoading = signal(true);
  readonly isAuthInitialized = signal(false);
  readonly isAuthenticated = computed(() => !!this.user());

  private authSubscription: { unsubscribe: () => void } | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      const client = this.supabaseClient.getClient();
      
      // First, get current session
      const { data: { session } } = await client.auth.getSession();
      
      if (session) {
        this.session.set(session);
        this.user.set(session.user);
        await this.loadProfile(session.user.id);
      }
      
      // Then subscribe to auth state changes for future updates
      this.authSubscription = client.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          // Skip INITIAL_SESSION since we already handled it above
          if (event === 'INITIAL_SESSION') return;
          
          this.session.set(session);
          this.user.set(session?.user ?? null);

          if (session?.user) {
            await this.loadProfile(session.user.id);
          } else {
            this.profile.set(null);
          }
        }
      ).data.subscription;
      
      // Mark initialization as complete
      this.isAuthInitialized.set(true);
      this.isLoading.set(false);
      
    } catch (error) {
      console.error('Error during auth initialization:', error);
      // Still mark as initialized to prevent infinite loading
      this.isAuthInitialized.set(true);
      this.isLoading.set(false);
    }
  }

  async loadProfile(userId: string): Promise<void> {
    try {
      const client = this.supabaseClient.getClient();
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile not found or error loading profile:', error.message);
        this.profile.set(null);
        return;
      }

      this.profile.set(data as Profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      this.profile.set(null);
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.isLoading.set(true);
      const client = this.supabaseClient.getClient();

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.isLoading.set(false);
        return { success: false, error: this.getErrorMessage(error.message) };
      }

      this.session.set(data.session);
      this.user.set(data.user ?? null);

      if (data.user) {
        await this.loadProfile(data.user.id);
      }

      this.isLoading.set(false);
      return { success: true };
    } catch (error) {
      this.isLoading.set(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signOut(): Promise<void> {
    try {
      const client = this.supabaseClient.getClient();
      
      // Sign out from Supabase - this clears the session from localStorage
      await client.auth.signOut();

      // Clear local auth state
      this.session.set(null);
      this.user.set(null);
      this.profile.set(null);

      // Navigate to login
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
      
      // Even if Supabase signOut fails, clear local state and redirect
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
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
