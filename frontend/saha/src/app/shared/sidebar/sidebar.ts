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

  readonly links: NavLink[] = [
    { label: 'Dashboard', path: '/dashboard', exact: true, section: 'SALES' },
    { label: 'Inquiries', hint: 'Pipeline & tracking', path: '/inquiries', exact: false, section: 'SALES' },
    { label: 'New Inquiry', path: '/inquiries/new', exact: true, section: 'SALES' },
    { label: 'Quotes', hint: 'Commercial quote builder', path: '/quotes', exact: false, section: 'SALES' },
    { label: 'Events', hint: 'Setup & customer confirmation', path: '/events', exact: false, section: 'SALES' },
    { label: 'Hotel Profile', path: '/hotel-profile', exact: true, section: 'SETUP' },
    { label: 'Reference Data', hint: 'Halls / Packages / Add-ons', path: '/setup/reference-data', exact: false, section: 'SETUP' },
    { label: 'Source Channels', path: '/setup/source-channels', exact: false, section: 'SETUP' },
    { label: 'Quote & VAT Settings', path: '/setup/quote-settings', exact: false, section: 'SETUP' },
    { label: 'Pilot Readiness', path: '/setup/readiness', exact: false, section: 'SETUP' },
    { label: 'Reporting', hint: 'Measurement & analytics', path: '/reporting', exact: false, section: 'REPORTING' },
    { label: 'Export & Quality', hint: 'CSV export & data quality', path: '/export', exact: false, section: 'REPORTING' },
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