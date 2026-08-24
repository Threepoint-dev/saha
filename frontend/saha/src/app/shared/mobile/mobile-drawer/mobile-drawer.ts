import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MobileDrawerService } from '../../../core/services/mobile-drawer.service';
import { Sidebar } from '../../sidebar/sidebar';

@Component({
  selector: 'app-mobile-drawer',
  imports: [Sidebar],
  templateUrl: './mobile-drawer.html'
})
export class MobileDrawer {
  readonly drawerService = inject(MobileDrawerService);
  private router = inject(Router);

  close() {
    this.drawerService.close();
  }

  navigateAndClose(path: string) {
    this.drawerService.close();
    this.router.navigate([path]);
  }
}
