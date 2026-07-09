import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

interface NavLink {
  label: string;
  hint?: string;
  path: string;
  exact: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html'
})
export class Sidebar {
  private router = inject(Router);

  /** The public quote preview is a standalone customer page — no app chrome. */
  readonly hidden = signal(this.isChromeless(this.router.url));

  readonly links: NavLink[] = [
    { label: 'Hotel Profile', path: '/', exact: true },
    { label: 'Reference Data', hint: 'Halls / Packages / Add-ons', path: '/setup/reference-data', exact: false },
    { label: 'Source Channels', path: '/setup/source-channels', exact: false },
    { label: 'Quote & VAT Settings', path: '/setup/quote-settings', exact: false },
    { label: 'Pilot Readiness', path: '/setup/readiness', exact: false },
    { label: 'Quotes', hint: 'Commercial quote builder', path: '/quotes', exact: false },
    { label: 'Events', hint: 'Setup & customer confirmation', path: '/events', exact: false },
    { label: 'Reporting', hint: 'Measurement & analytics', path: '/reporting', exact: false },
    { label: 'Export & Quality', hint: 'CSV export & data quality', path: '/export', exact: false }
  ];

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((e) => this.hidden.set(this.isChromeless(e.urlAfterRedirects)));
  }

  private isChromeless(url: string): boolean {
    return url.startsWith('/quotes/preview') || url.startsWith('/events/summary');
  }
}
