import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from './shared/sidebar/sidebar';
import { BottomTabBar } from './shared/mobile/bottom-tab-bar/bottom-tab-bar';
import { MobileDrawer } from './shared/mobile/mobile-drawer/mobile-drawer';
import { filter } from 'rxjs/operators';

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
