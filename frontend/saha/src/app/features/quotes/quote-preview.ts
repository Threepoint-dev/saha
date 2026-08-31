import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { LanguageService } from '../../core/services/language.service';
import { PublicQuote } from './quotes.model';
import { QuotesService } from './quotes.service';

@Component({
  selector: 'app-quote-preview',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './quote-preview.html'
})
export class QuotePreview implements OnInit {
  private service = inject(QuotesService);
  private route = inject(ActivatedRoute);
  languageService = inject(LanguageService);

  readonly quote = signal<PublicQuote | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly copied = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('shareToken') ?? '';
    this.service.getPublicQuote(token).subscribe({
      next: (q) => { this.quote.set(q); this.loading.set(false); },
      error: () => { this.notFound.set(true); this.loading.set(false); }
    });
  }

  copyLink(): void {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  print(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  toggleLanguage(): void {
    this.languageService.toggle();
  }
}