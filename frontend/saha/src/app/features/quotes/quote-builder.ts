import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import { CatalogItem, InquirySummary, LineItemRequest, Quote, QuoteLineItem } from './quotes.model';
import { QuotesService } from './quotes.service';

interface AddModel {
  source: string;
  itemName: string;
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  isTaxable: boolean;
}

@Component({
  selector: 'app-quote-builder',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './quote-builder.html'
})
export class QuoteBuilder implements OnInit {
  private service = inject(QuotesService);
  private route = inject(ActivatedRoute);

  readonly tenantId = environment.tenantId;
  readonly inquiryId = signal<string>('');
  readonly quoteId = signal<string>('');

  readonly quote = signal<Quote | null>(null);
  readonly inquiry = signal<InquirySummary | null>(null);
  readonly items = signal<QuoteLineItem[]>([]);
  readonly catalog = signal<CatalogItem[]>([]);

  readonly loading = signal(false);
  readonly savingNotes = signal(false);
  readonly adding = signal(false);
  readonly sharing = signal(false);
  readonly copied = signal(false);
  readonly shareUrl = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly dragIndex = signal<number | null>(null);

  notes = '';

  readonly addModel: AddModel = this.emptyAddModel();

  readonly halls = computed(() => this.catalog().filter((c) => c.type === 'hall'));
  readonly packages = computed(() => this.catalog().filter((c) => c.type === 'package'));
  readonly addons = computed(() => this.catalog().filter((c) => c.type === 'addon'));

  ngOnInit(): void {
    this.inquiryId.set(this.route.snapshot.paramMap.get('inquiryId') ?? '');
    this.quoteId.set(this.route.snapshot.paramMap.get('quoteId') ?? '');
    this.load();
    this.service.getInquiry(this.tenantId, this.inquiryId()).subscribe({
      next: (i) => this.inquiry.set(i),
      error: () => this.inquiry.set(null)
    });
    this.service.loadCatalog(this.tenantId).subscribe({
      next: (c) => this.catalog.set(c),
      error: () => this.catalog.set([])
    });
  }

  private load(): void {
    this.loading.set(true);
    this.service.getQuote(this.tenantId, this.inquiryId(), this.quoteId()).subscribe({
      next: (q) => {
        this.quote.set(q);
        this.items.set(q.lineItems ?? []);
        this.notes = q.notes ?? '';
        if (q.shareLink) {
          this.shareUrl.set(this.buildShareUrl(q.shareLink));
        }
        this.loading.set(false);
      },
      error: (err) => { this.errorMessage.set(this.formatError(err, 'Failed to load quote.')); this.loading.set(false); }
    });
  }

  /** Refresh quote + items from the server (after totals change). */
  private refresh(): void {
    this.service.getQuote(this.tenantId, this.inquiryId(), this.quoteId()).subscribe({
      next: (q) => { this.quote.set(q); this.items.set(q.lineItems ?? []); }
    });
  }

  // --- Add line item ---
  onSourceChange(): void {
    const id = this.addModel.source;
    if (!id || id === 'custom') {
      this.addModel.itemType = 'custom';
      return;
    }
    const item = this.catalog().find((c) => c.id === id);
    if (item) {
      this.addModel.itemName = item.name;
      this.addModel.unitPrice = item.price ?? 0;
      this.addModel.isTaxable = item.isTaxable;
      this.addModel.itemType = item.type;
    }
  }

  addItem(): void {
    this.clearMessages();
    const name = this.addModel.itemName.trim();
    if (!name) { this.errorMessage.set('Enter a name for the line item.'); return; }
    const body: LineItemRequest = {
      itemName: name,
      itemType: this.addModel.itemType || 'custom',
      description: this.addModel.description?.trim() || null,
      quantity: Number(this.addModel.quantity) || 1,
      unitPrice: Number(this.addModel.unitPrice) || 0,
      isTaxable: this.addModel.isTaxable
    };
    this.adding.set(true);
    this.service.addLineItem(this.tenantId, this.quoteId(), body).subscribe({
      next: () => {
        this.adding.set(false);
        Object.assign(this.addModel, this.emptyAddModel());
        this.refresh();
        this.successMessage.set('Line item added.');
      },
      error: (err) => { this.adding.set(false); this.errorMessage.set(this.formatError(err, 'Failed to add line item.')); }
    });
  }

  // --- Edit line item (on blur / change) ---
  saveItem(item: QuoteLineItem): void {
    this.clearMessages();
    const body: LineItemRequest = {
      itemName: (item.itemName ?? '').trim() || 'Item',
      itemType: item.itemType ?? 'custom',
      description: item.description,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      isTaxable: item.isTaxable ?? true,
      sortOrder: item.sortOrder
    };
    this.service.updateLineItem(this.tenantId, this.quoteId(), item.id, body).subscribe({
      next: () => this.refresh(),
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to update line item.'))
    });
  }

  toggleTaxable(item: QuoteLineItem): void {
    item.isTaxable = !item.isTaxable;
    this.saveItem(item);
  }

  deleteItem(item: QuoteLineItem): void {
    this.clearMessages();
    this.service.deleteLineItem(this.tenantId, this.quoteId(), item.id).subscribe({
      next: () => this.refresh(),
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to remove line item.'))
    });
  }

  rowTotal(item: QuoteLineItem): number {
    return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }

  // --- Drag to reorder ---
  onDragStart(index: number): void { this.dragIndex.set(index); }
  onDragOver(event: DragEvent): void { event.preventDefault(); }
  onDragEnd(): void { this.dragIndex.set(null); }

  onDrop(targetIndex: number): void {
    const from = this.dragIndex();
    this.dragIndex.set(null);
    if (from === null || from === targetIndex) return;
    const reordered = [...this.items()];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(targetIndex, 0, moved);
    this.items.set(reordered);
    this.service.reorderLineItems(this.tenantId, this.quoteId(), reordered.map((i) => i.id)).subscribe({
      next: () => this.refresh(),
      error: (err) => { this.errorMessage.set(this.formatError(err, 'Failed to save order.')); this.refresh(); }
    });
  }

  // --- Notes / save ---
  saveNotes(): void {
    this.clearMessages();
    this.savingNotes.set(true);
    this.service.updateQuote(this.tenantId, this.inquiryId(), this.quoteId(), { notes: this.notes, status: null }).subscribe({
      next: (q) => { this.savingNotes.set(false); this.quote.set(q); this.successMessage.set('Quote saved.'); },
      error: (err) => { this.savingNotes.set(false); this.errorMessage.set(this.formatError(err, 'Failed to save quote.')); }
    });
  }

  // --- Share ---
  share(): void {
    this.clearMessages();
    this.sharing.set(true);
    // Persist notes first so the shared quote is up to date.
    this.service.updateQuote(this.tenantId, this.inquiryId(), this.quoteId(), { notes: this.notes, status: null }).subscribe({
      next: () => {
        this.service.share(this.tenantId, this.quoteId()).subscribe({
          next: (res) => {
            this.sharing.set(false);
            this.shareUrl.set(this.buildShareUrl(res.shareToken));
            this.successMessage.set('Shareable link generated.');
          },
          error: (err) => { this.sharing.set(false); this.errorMessage.set(this.formatError(err, 'Failed to generate link.')); }
        });
      },
      error: (err) => { this.sharing.set(false); this.errorMessage.set(this.formatError(err, 'Failed to save before sharing.')); }
    });
  }

  copyLink(): void {
    const url = this.shareUrl();
    if (!url) return;
    navigator.clipboard?.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  private buildShareUrl(token: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/quotes/preview/${token}`;
  }

  private emptyAddModel(): AddModel {
    return { source: 'custom', itemName: '', itemType: 'custom', description: '', quantity: 1, unitPrice: 0, isTaxable: true };
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}
