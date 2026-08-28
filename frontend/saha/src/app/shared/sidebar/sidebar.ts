import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

interface NavLink {
  /** Translation key, e.g. 'sidebar.dashboard' — resolved via the translate pipe in the template. */
  label: string;
  hint?: string;
  path: string;
  exact: boolean;
  section?: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './sidebar.html'
})
export class Sidebar {
  private router = inject(Router);
  authService = inject(AuthService);
  languageService = inject(LanguageService);

  readonly hidden = signal(this.isChromeless(this.router.url));

  readonly allLinks: NavLink[] = [
    // SALES — Director of Sales oversees, Sales Rep does the day-to-day work
    { label: 'sidebar.dashboard', path: '/dashboard', exact: true, section: 'sales',
      roles: ['SAHA_ADMIN', 'DIRECTOR_OF_SALES', 'SALES_REP'] },
    { label: 'sidebar.inquiries', hint: 'sidebar.inquiriesHint', path: '/inquiries', exact: false, section: 'sales',
      roles: ['SAHA_ADMIN', 'DIRECTOR_OF_SALES', 'SALES_REP'] },
    { label: 'sidebar.newInquiry', path: '/inquiries/new', exact: true, section: 'sales',
      roles: ['SAHA_ADMIN', 'DIRECTOR_OF_SALES', 'SALES_REP'] },
    { label: 'sidebar.hallAvailability', hint: 'sidebar.hallAvailabilityHint', path: '/availability', exact: false, section: 'sales',
      roles: ['SAHA_ADMIN', 'DIRECTOR_OF_SALES', 'SALES_REP'] },

    // EVENTS OPS — Events Team and Events Director only
    { label: 'sidebar.eventRequests', hint: 'sidebar.eventRequestsHint', path: '/events', exact: false, section: 'operations',
      roles: ['EVENTS_TEAM', 'EVENTS_DIRECTOR'] },
    { label: 'sidebar.eventsDashboard', path: '/events/dashboard', exact: false, section: 'operations',
      roles: ['EVENTS_DIRECTOR'] },
    { label: 'sidebar.hallAvailability', hint: 'sidebar.hallAvailabilityHint', path: '/availability', exact: false, section: 'operations',
      roles: ['EVENTS_DIRECTOR'] },

    // SETUP — SAHA Admin and Director of Sales only (hotel-side management)
    { label: 'sidebar.manageUsers', hint: 'sidebar.manageUsersHint', path: '/setup/users', exact: false, section: 'setup',
      roles: ['DIRECTOR_OF_SALES'] },
    { label: 'sidebar.hotelProfile', path: '/hotel-profile', exact: true, section: 'setup',
      roles: ['DIRECTOR_OF_SALES'] },
    { label: 'sidebar.referenceData', hint: 'sidebar.referenceDataHint', path: '/setup/reference-data', exact: false, section: 'setup',
      roles: ['DIRECTOR_OF_SALES'] },
    { label: 'sidebar.sourceChannels', path: '/setup/source-channels', exact: false, section: 'setup',
      roles: ['DIRECTOR_OF_SALES'] },
    { label: 'sidebar.quoteVatSettings', path: '/setup/quote-settings', exact: false, section: 'setup',
      roles: ['DIRECTOR_OF_SALES'] },

    // REPORTING — SAHA Admin and Director of Sales (Events Director has its own Events Dashboard above)
    { label: 'sidebar.reporting', hint: 'sidebar.reportingHint', path: '/reporting', exact: false, section: 'reporting',
      roles: ['DIRECTOR_OF_SALES'] },
    { label: 'sidebar.exportQuality', hint: 'sidebar.exportQualityHint', path: '/export', exact: false, section: 'reporting',
      roles: ['DIRECTOR_OF_SALES'] },

    // ADMIN — SAHA Admin only, platform-level
    { label: 'sidebar.hotelManagement', hint: 'sidebar.hotelManagementHint', path: '/admin', exact: true, section: 'admin',
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

  /** Translation key for a section's header label, e.g. 'sales' -> 'sidebar.section.sales'. */
  sectionLabelKey(section: string): string {
    return `sidebar.section.${section}`;
  }

  getLinksBySection(section: string): NavLink[] {
    return this.links.filter(l => l.section === section);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  toggleLanguage(): void {
    this.languageService.toggle();
  }

  signOut() {
    this.authService.signOut();
  }
}