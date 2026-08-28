import { Component, inject, input } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { MobileDrawerService } from '../../core/services/mobile-drawer.service';

@Component({
  selector: 'app-admin-page-header',
  templateUrl: './admin-page-header.html'
})
export class AdminPageHeader {
  readonly subtitle = input.required<string>();

  private auth = inject(AuthService);
  readonly drawerService = inject(MobileDrawerService);

  get roleLabel(): string {
    switch (this.auth.currentUser()?.role) {
      case 'SAHA_ADMIN': return 'SAHA Admin';
      case 'DIRECTOR_OF_SALES': return 'Director of Sales';
      case 'SALES_REP': return 'Sales Rep';
      case 'EVENTS_DIRECTOR': return 'Events Director';
      case 'EVENTS_TEAM': return 'Events Team';
      default: return this.auth.currentUser()?.role ?? '';
    }
  }

  get email(): string {
    return this.auth.currentUser()?.email ?? '';
  }

  get initials(): string {
    const name = this.auth.currentUser()?.fullName ?? '';
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
