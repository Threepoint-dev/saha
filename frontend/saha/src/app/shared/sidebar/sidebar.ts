import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface NavLink {
  label: string;
  hint?: string;
  path: string;
  exact: boolean;
  section?: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html'
})
export class Sidebar {
  private router = inject(Router);
  authService = inject(AuthService);

  readonly hidden = signal(this.isChromeless(this.router.url));

  readonly allLinks: NavLink[] = [
    // SALES — Director of Sales oversees, Sales Rep does the day-to-day work
    { label: 'Dashboard', path: '/dashboard', exact: true, section: 'SALES',
      roles: ['SAHA_ADMIN', 'DIRECTOR_OF_SALES', 'SALES_REP'] },
    { label: 'Inquiries', hint: 'Pipeline & tracking', path: '/inquiries', exact: false, section: 'SALES',
      roles: ['SAHA_ADMIN', 'DIRECTOR_OF_SALES', 'SALES_REP'] },
    { label: 'New Inquiry', path: '/inquiries/new', exact: true, section: 'SALES',
      roles: ['SAHA_ADMIN', 'DIRECTOR_OF_SALES', 'SALES_REP'] },
    { label: 'Hall Availability', hint: 'Check before you quote', path: '/availability', exact: false, section: 'SALES',
      roles: ['SAHA_ADMIN', 'DIRECTOR_OF_SALES', 'SALES_REP', 'EVENTS_DIRECTOR'] },

    // EVENTS OPS — Events Team and Events Director only
    { label: 'Event Requests', hint: 'Handoff from sales', path: '/events', exact: false, section: 'OPERATIONS',
      roles: ['EVENTS_TEAM', 'EVENTS_DIRECTOR'] },
    { label: 'Events Dashboard', path: '/events/dashboard', exact: false, section: 'OPERATIONS',
      roles: ['EVENTS_DIRECTOR'] },

    // SETUP — SAHA Admin and Director of Sales only (hotel-side management)
    { label: 'Manage Users', hint: 'Invite & manage your team', path: '/setup/users', exact: false, section: 'SETUP',
      roles: ['DIRECTOR_OF_SALES'] },
    { label: 'Hotel Profile', path: '/hotel-profile', exact: true, section: 'SETUP',
      roles: ['DIRECTOR_OF_SALES'] },
    { label: 'Reference Data', hint: 'Halls / Packages / Add-ons', path: '/setup/reference-data', exact: false, section: 'SETUP',
      roles: ['DIRECTOR_OF_SALES'] },
    { label: 'Source Channels', path: '/setup/source-channels', exact: false, section: 'SETUP',
      roles: ['DIRECTOR_OF_SALES'] },
    { label: 'Quote & VAT Settings', path: '/setup/quote-settings', exact: false, section: 'SETUP',
      roles: ['DIRECTOR_OF_SALES'] },

    // REPORTING — SAHA Admin and Director of Sales (Events Director has its own Events Dashboard above)
    { label: 'Reporting', hint: 'Measurement & analytics', path: '/reporting', exact: false, section: 'REPORTING',
      roles: ['DIRECTOR_OF_SALES'] },
    { label: 'Export & Quality', hint: 'CSV export & data quality', path: '/export', exact: false, section: 'REPORTING',
      roles: ['DIRECTOR_OF_SALES'] },

    // ADMIN — SAHA Admin only, platform-level
    { label: 'Hotel Management', hint: 'Manage pilot hotels', path: '/admin', exact: true, section: 'ADMIN',
      roles: ['SAHA_ADMIN'] },
  ];

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((e) => this.hidden.set(this.isChromeless(e.urlAfterRedirects)));
  }

  private isChromeless(url: string): boolean {
    return url.startsWith('/quotes/preview')
      || url.startsWith('/events/summary')
      || url.startsWith('/login')
      || url === '/';
  }

  get links(): NavLink[] {
    const role = this.authService.currentUser()?.role || '';
    return this.allLinks.filter(l =>
      !l.roles || l.roles.includes(role)
    );
  }

  isInquiriesActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/inquiries') && !url.includes('/new');
  }

  getSections(): string[] {
    return [...new Set(this.links.map(l => l.section || ''))];
  }

  getLinksBySection(section: string): NavLink[] {
    return this.links.filter(l => l.section === section);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  signOut() {
    this.authService.signOut();
  }
}