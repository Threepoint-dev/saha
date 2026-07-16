import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
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
    return await this.supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
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