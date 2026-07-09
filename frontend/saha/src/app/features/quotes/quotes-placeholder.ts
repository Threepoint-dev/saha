import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-quotes-placeholder',
  imports: [CommonModule, FormsModule],
  templateUrl: './quotes-placeholder.html'
})
export class QuotesPlaceholder {
  private router = inject(Router);

  readonly inquiryId = signal<string>('');

  open(): void {
    const id = this.inquiryId().trim();
    if (id) {
      this.router.navigate(['/quotes', id]);
    }
  }
}
