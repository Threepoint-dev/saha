import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { PublicQuote } from './quotes.model';
import { QuotesService } from './quotes.service';

@Component({
  selector: 'app-quote-preview',
  imports: [CommonModule],
  templateUrl: './quote-preview.html'
})
export class QuotePreview implements OnInit {
  private service = inject(QuotesService);
  private route = inject(ActivatedRoute);

  readonly quote = signal<PublicQuote | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('shareToken') ?? '';
    this.service.getPublicQuote(token).subscribe({
      next: (q) => { this.quote.set(q); this.loading.set(false); },
      error: () => { this.notFound.set(true); this.loading.set(false); }
    });
  }

  print(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
