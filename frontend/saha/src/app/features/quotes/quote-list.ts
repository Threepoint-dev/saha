import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { StatusBadge } from '../../shared/mobile/status-badge/status-badge';
import { InquirySummary, Quote } from './quotes.model';
import { QuotesService } from './quotes.service';

@Component({
  selector: 'app-quote-list',
  imports: [CommonModule, RouterLink, StatusBadge],
  templateUrl: './quote-list.html'
})
export class QuoteList implements OnInit {
  private service = inject(QuotesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  get tenantId(): string {
    return this.authService.getTenantId();
  }
  readonly inquiryId = signal<string>('');

  readonly inquiry = signal<InquirySummary | null>(null);
  readonly quotes = signal<Quote[]>([]);
  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly copiedId = signal<string | null>(null);

  readonly quoteCount = computed(() => this.quotes().length);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('inquiryId') ?? '';
    this.inquiryId.set(id);
    this.loadInquiry();
    this.loadQuotes();
  }

  private loadInquiry(): void {
    this.service.getInquiry(this.tenantId, this.inquiryId()).subscribe({
      next: (i) => this.inquiry.set(i),
      error: () => this.inquiry.set(null)
    });
  }

  private loadQuotes(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.service.listQuotes(this.tenantId, this.inquiryId()).subscribe({
      next: (list) => { this.quotes.set(list); this.loading.set(false); },
      error: (err) => { this.errorMessage.set(this.formatError(err, 'Failed to load quotes.')); this.loading.set(false); }
    });
  }

  newQuote(): void {
    this.creating.set(true);
    this.errorMessage.set(null);
    this.service.createQuote(this.tenantId, this.inquiryId()).subscribe({
      next: (quote) => { this.creating.set(false); this.openBuilder(quote.id); },
      error: (err) => { this.creating.set(false); this.errorMessage.set(this.formatError(err, 'Failed to create quote.')); }
    });
  }

  openBuilder(quoteId: string): void {
    this.router.navigate(['/quotes', this.inquiryId(), quoteId]);
  }

  duplicate(quote: Quote): void {
    this.errorMessage.set(null);
    this.service.duplicateQuote(this.tenantId, this.inquiryId(), quote.id).subscribe({
      next: (copy) => this.openBuilder(copy.id),
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to duplicate quote.'))
    });
  }

  cancel(quote: Quote): void {
    if (!confirm(`Cancel quote ${quote.quoteNumber ?? ''}? It will be marked as cancelled.`)) return;
    this.errorMessage.set(null);
    this.service.cancelQuote(this.tenantId, this.inquiryId(), quote.id).subscribe({
      next: () => this.loadQuotes(),
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to cancel quote.'))
    });
  }

  pdf(quote: Quote): void {
    if (quote.shareLink) {
      window.open(this.buildShareUrl(quote.shareLink), '_blank');
      return;
    }
    this.errorMessage.set(null);
    this.service.share(this.tenantId, quote.id).subscribe({
      next: (res) => window.open(this.buildShareUrl(res.shareToken), '_blank'),
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to open PDF.'))
    });
  }

  copyLink(quote: Quote): void {
    const done = (token: string) => {
      navigator.clipboard?.writeText(this.buildShareUrl(token)).then(() => {
        this.copiedId.set(quote.id);
        setTimeout(() => this.copiedId.set(null), 2000);
      });
    };
    if (quote.shareLink) { done(quote.shareLink); return; }
    this.errorMessage.set(null);
    this.service.share(this.tenantId, quote.id).subscribe({
      next: (res) => { done(res.shareToken); this.loadQuotes(); },
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to create share link.'))
    });
  }

  /** Draft | Shared | Final | Expired | Cancelled — the pill shown on the card. */
  displayStatus(quote: Quote): string {
    const s = (quote.status ?? 'draft').toLowerCase();
    if (s === 'cancelled') return 'cancelled';
    if (s === 'final' || s === 'accepted') return 'final';
    if (this.isExpired(quote)) return 'expired';
    if (quote.shareLink || s === 'sent' || s === 'shared') return 'shared';
    return 'draft';
  }

  isExpired(quote: Quote): boolean {
    const s = (quote.status ?? '').toLowerCase();
    if (s === 'final' || s === 'accepted' || s === 'cancelled') return false;
    if (!quote.validUntil) return false;
    const until = new Date(quote.validUntil);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return until.getTime() < today.getTime();
  }

  isReadOnly(quote: Quote): boolean {
    const s = this.displayStatus(quote);
    return s === 'final' || s === 'expired' || s === 'cancelled';
  }

  private buildShareUrl(token: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/quotes/preview/${token}`;
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}
