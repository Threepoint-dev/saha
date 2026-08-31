import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from './shared/sidebar/sidebar';
import { BottomTabBar } from './shared/mobile/bottom-tab-bar/bottom-tab-bar';
import { MobileDrawer } from './shared/mobile/mobile-drawer/mobile-drawer';
import { filter } from 'rxjs/operators';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, BottomTabBar, MobileDrawer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  showSidebar = false;
  isSalesRoute = false;

  private readonly SALES_PREFIXES = ['/dashboard', '/inquiries', '/quotes', '/events', '/availability'];

  // Injecting this here (even though unused directly) makes it start up
  // immediately when the app loads, so the saved language + RTL direction
  // are applied before the first page even renders.
  private languageService = inject(LanguageService);

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url: string = event.urlAfterRedirects ?? event.url;
      this.showSidebar = !this.isChromeless(url);
      this.isSalesRoute = this.SALES_PREFIXES.some(p => url.startsWith(p));
    });
  }

  private isChromeless(url: string): boolean {
    return url.startsWith('/quotes/preview')
      || url.startsWith('/events/summary')
      || url.startsWith('/login')
      || url === '/';
  }
}