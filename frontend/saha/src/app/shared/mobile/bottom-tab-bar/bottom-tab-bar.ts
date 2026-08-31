import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-bottom-tab-bar',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './bottom-tab-bar.html'
})
export class BottomTabBar {
  private router = inject(Router);

  get url(): string { return this.router.url; }

  isDashboardActive(): boolean { return this.url === '/dashboard'; }

  isInquiriesActive(): boolean {
    return this.url.startsWith('/inquiries') && !this.url.startsWith('/inquiries/new');
  }

  isQuotesActive(): boolean { return this.url.startsWith('/quotes'); }

  isSettingsActive(): boolean {
    return this.url.startsWith('/hotel-profile') || this.url.startsWith('/setup');
  }

  navigateToQuotes(): void {
    // Quotes are accessed per-inquiry; route to pipeline until a dedicated screen exists (Phase 1)
    this.router.navigate(['/inquiries']);
  }
}
