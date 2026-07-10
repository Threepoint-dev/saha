import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-events-placeholder',
  imports: [CommonModule, FormsModule],
  templateUrl: './events-placeholder.html'
})
export class EventsPlaceholder {
  private router = inject(Router);

  inquiryId = '';

  open(): void {
    const id = this.inquiryId.trim();
    if (id) {
      this.router.navigate(['/events', id]);
    }
  }
}
