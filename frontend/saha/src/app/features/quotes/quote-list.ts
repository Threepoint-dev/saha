import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { AdminPageHeader } from '../../shared/admin-page-header/admin-page-header';
import { InquirySummary, Quote } from './quotes.model';
import { QuotesService } from './quotes.service';

@Component({
  selector: 'app-quote-list',
  imports: [CommonModule, AdminPageHeader],
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

  statusStyle(status: string | null): { bg: string; border: string; text: string } {
    switch ((status ?? '').toLowerCase()) {
      case 'draft':
        return { bg: '#f7e7d6', border: '#e0922f', text: '#b06d1a' };
      case 'sent':
        return { bg: '#d6edf5', border: '#2c7a8c', text: '#1f5b68' };
      case 'accepted':
        return { bg: '#dff0e8', border: '#2e7d5b', text: '#1f5c41' };
      case 'cancelled':
        return { bg: '#f7dede', border: '#d14343', text: '#a02f2f' };
      default:
        return { bg: '#efebf3', border: '#c9c3b8', text: '#55514a' };
    }
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}