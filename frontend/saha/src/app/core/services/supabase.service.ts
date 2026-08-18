import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  /**
   * The current login token, kept up to date automatically by Supabase's own
   * auth events (not by us asking for it). The HTTP interceptor reads this
   * directly and synchronously — it must never call back into Supabase's
   * auth methods (like getSession()) itself, because doing so while another
   * auth call (e.g. verifyOtp right after login) is still finishing can
   * deadlock Supabase's internal client and freeze the page forever.
   */
  readonly accessToken = signal<string | null>(null);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    // Supabase fires this immediately with any existing session on startup,
    // and again on every sign-in/sign-out/token-refresh — so accessToken
    // stays correct without this service ever having to ask for it.
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.accessToken.set(session?.access_token ?? null);
    });
  }

  get client() {
    return this.supabase;
  }

  // Sign in with OTP
  async sendOtp(email: string) {
    return await this.supabase.auth.signInWithOtp({ email });
  }

  // Verify OTP
  async verifyOtp(email: string, token: string) {
    const result = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    // Set the token immediately from this call's own result — don't rely on
    // the onAuthStateChange event, which can arrive slightly after this
    // resolves and cause the very next API call to go out with no token yet.
    if (result.data.session?.access_token) {
      this.accessToken.set(result.data.session.access_token);
    }
    return result;
  }

  // Get current session
  async getSession() {
    return await this.supabase.auth.getSession();
  }

  // Get current user
  async getUser() {
    return await this.supabase.auth.getUser();
  }

  // Sign out
  async signOut() {
    return await this.supabase.auth.signOut();
  }

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}