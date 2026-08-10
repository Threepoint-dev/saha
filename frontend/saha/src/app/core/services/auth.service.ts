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

  // Holds the in-flight "load my profile" request so the auth listener and
  // the route guard share one result instead of racing each other.
  private userLoadPromise: Promise<CurrentUser | null> | null = null;

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
          const user = await this.loadUserProfile(session.user.email!);
          if (user) {
            this.redirectAfterSignIn(user.role);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        this.currentUser.set(null);
        this.userLoadPromise = null;
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
      const user = await this.loadUserProfile(email);
      if (!user) {
        return { success: false, error: 'Your account is not active yet. Please contact your admin.' };
      }
      this.redirectAfterSignIn(user.role);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Loads the signed-in user's profile and stores it in currentUser.
   * Returns null (and signs the person out) if the account is not ACTIVE,
   * so an invited-but-not-onboarded or deactivated user can't use the app
   * just because their email OTP succeeded.
   */
  private async loadUserProfile(email: string): Promise<CurrentUser | null> {
    if (!this.userLoadPromise) {
      this.userLoadPromise = this.fetchUserProfile(email);
    }
    const user = await this.userLoadPromise;
    this.userLoadPromise = null;
    return user;
  }

  private async fetchUserProfile(email: string): Promise<CurrentUser | null> {
    try {
      const user = await firstValueFrom(
        this.http.get<CurrentUser>(
          `${environment.apiBaseUrl}/api/users/email/${email}`
        )
      );
      if (user.status !== 'ACTIVE') {
        this.currentUser.set(null);
        // Fire-and-forget: awaiting signOut() here while a verify/login call is
        // still finishing can deadlock Supabase's internal auth lock, which
        // freezes the login screen forever. The local session is cleared
        // immediately above; the remote sign-out doesn't need to block the UI.
        this.supabase.signOut().catch(() => {});
        return null;
      }
      this.currentUser.set(user);
      return user;
    } catch {
      this.currentUser.set(null);
      return null;
    }
  }

  /**
   * Used by the route guard. If a valid Supabase session exists but the
   * user profile hasn't loaded yet (e.g. straight after a hard refresh),
   * this waits for it instead of letting the guard read an empty role.
   */
  async ensureUserLoaded(): Promise<CurrentUser | null> {
    if (this.currentUser()) {
      return this.currentUser();
    }
    const { data } = await this.supabase.getSession();
    const email = data.session?.user?.email;
    if (!email) {
      return null;
    }
    return this.loadUserProfile(email);
  }

  private redirectAfterSignIn(role: string) {
    const currentUrl = this.router.url;
    if (currentUrl === '/login' || currentUrl === '/') {
      this.redirectByRole(role);
    }
  }

  private redirectByRole(role: string) {
    switch (role) {
      case 'SAHA_ADMIN':
        this.router.navigate(['/admin']);
        break;
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

  getTenantId(): string {
    return this.currentUser()?.tenantId || environment.tenantId;
  }
}