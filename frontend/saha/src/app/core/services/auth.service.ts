import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<CurrentUser | null>(null);
  isLoading = signal<boolean>(false);

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private http: HttpClient
  ) {
    this.initAuthListener();
  }

  private initAuthListener() {
    this.supabase.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (!this.currentUser()) {
          await this.loadUserProfile(session.user.email!);
        }
      } else if (event === 'SIGNED_OUT') {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      }
    });
  }

  async sendOtp(email: string) {
    this.isLoading.set(true);
    try {
      const { error } = await this.supabase.sendOtp(email);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      this.isLoading.set(false);
    }
  }

  async verifyOtp(email: string, token: string) {
    this.isLoading.set(true);
    try {
      const { error } = await this.supabase.verifyOtp(email, token);
      if (error) throw error;
      await this.loadUserProfile(email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadUserProfile(email: string) {
    try {
      const user = await firstValueFrom(
        this.http.get<CurrentUser>(
          `${environment.apiBaseUrl}/api/users/email/${email}`
        )
      );
      this.currentUser.set(user);
      const currentUrl = this.router.url;
      if (currentUrl === '/login' || currentUrl === '/') {
        this.redirectByRole(user.role);
      }
    } catch {
      this.currentUser.set(null);
    }
  }

  private redirectByRole(role: string) {
    switch (role) {
      case 'SAHA_ADMIN':
      case 'DIRECTOR_OF_SALES':
      case 'SALES_REP':
        this.router.navigate(['/dashboard']);
        break;
      case 'EVENTS_TEAM':
      case 'EVENTS_DIRECTOR':
        this.router.navigate(['/events']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  async signOut() {
    await this.supabase.signOut();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.role === role;
  }
}