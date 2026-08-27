import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { BottomSheetModal } from '../../shared/mobile/bottom-sheet-modal/bottom-sheet-modal';
import { StatusBadge } from '../../shared/mobile/status-badge/status-badge';
import { CatalogItem, InquirySummary, LineItemRequest, Quote, QuoteLineItem } from './quotes.model';
import { QuotesService } from './quotes.service';

interface ItemModel {
  itemName: string;
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  isTaxable: boolean;
}

interface ValidationError {
  message: string;
  scope: string;
}

type BuilderView = 'build' | 'review' | 'sent';

@Component({
  selector: 'app-quote-builder',
  imports: [CommonModule, FormsModule, RouterLink, BottomSheetModal, StatusBadge],
  templateUrl: './quote-builder.html'
})
export class QuoteBuilder implements OnInit {
  private service = inject(QuotesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  get tenantId(): string {
    return this.authService.getTenantId();
  }
  readonly inquiryId = signal<string>('');
  readonly quoteId = signal<string>('');

  readonly quote = signal<Quote | null>(null);
  readonly inquiry = signal<InquirySummary | null>(null);
  readonly items = signal<QuoteLineItem[]>([]);
  readonly catalog = signal<CatalogItem[]>([]);

  readonly loading = signal(false);
  readonly adding = signal(false);
  readonly sharing = signal(false);
  readonly finalizing = signal(false);
  readonly copied = signal(false);
  readonly shareUrl = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly view = signal<BuilderView>('build');
  readonly sheet = signal<'none' | 'add' | 'edit' | 'finalize'>('none');
  readonly sentAt = signal<Date | null>(null);
  readonly showValidation = signal(false);

  readonly dragIndex = signal<number | null>(null);

  editingId: string | null = null;
  readonly itemModel: ItemModel = this.emptyItemModel();

  notes = '';

  readonly itemTypes = [
    { label: 'Hall rental', value: 'hall' },
    { label: 'Catering', value: 'package' },
    { label: 'Coffee break', value: 'coffee_break' },
    { label: 'AV package', value: 'av_package' },
    { label: 'Decoration', value: 'decoration' },
    { label: 'Service staff', value: 'service_staff' },
    { label: 'Custom', value: 'custom' },
  ];

  readonly filteredCatalog = computed(() => {
    const type = this.itemModel.itemType;
    const name = (this.itemModel.itemName || '').toLowerCase().trim();
    if (!name) return [];
    return this.catalog()
      .filter((c) => c.name.toLowerCase().includes(name) && (type === 'custom' || c.type === type || !type))
      .slice(0, 6);
  });

  readonly isReadOnly = computed(() => {
    const s = (this.quote()?.status ?? '').toLowerCase();
    return s === 'final' || s === 'accepted' || s === 'cancelled';
  });

  readonly validationErrors = computed<ValidationError[]>(() => {
    const q = this.quote();
    const errors: ValidationError[] = [];
    if (!q?.validUntil) {
      errors.push({ message: '"Valid until" date is required', scope: 'Hotel details' });
    }
    if (this.items().length === 0) {
      errors.push({ message: 'Add at least one line item', scope: 'Line items' });
    }
    if (this.items().some((i) => (Number(i.quantity) || 0) <= 0)) {
      errors.push({ message: 'Line item has zero quantity', scope: 'Line items' });
    }
    if ((q?.total ?? 0) <= 0) {
      errors.push({ message: 'Total is below minimum', scope: 'Line items' });
    }
    return errors;
  });

  readonly canFinalize = computed(() => this.validationErrors().length === 0);

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
        this.applyQuote(q);
        this.notes = q.notes ?? '';
        if (q.shareLink) this.shareUrl.set(this.buildShareUrl(q.shareLink));
        this.loading.set(false);
      },
      error: (err) => { this.errorMessage.set(this.formatError(err, 'Failed to load quote.')); this.loading.set(false); }
    });
  }

  private refresh(): void {
    this.service.getQuote(this.tenantId, this.inquiryId(), this.quoteId()).subscribe({
      next: (q) => this.applyQuote(q)
    });
  }

  private applyQuote(q: Quote): void {
    this.quote.set(q);
    this.items.set([...(q.lineItems ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
  }

  // ── Line-item sheet ────────────────────────────────
  openAddSheet(): void {
    if (this.isReadOnly()) return;
    this.editingId = null;
    Object.assign(this.itemModel, this.emptyItemModel());
    this.clearMessages();
    this.sheet.set('add');
  }

  openEditSheet(item: QuoteLineItem): void {
    if (this.isReadOnly()) return;
    this.editingId = item.id;
    this.itemModel.itemName = item.itemName ?? '';
    this.itemModel.itemType = item.itemType ?? 'custom';
    this.itemModel.description = item.description ?? '';
    this.itemModel.quantity = Number(item.quantity) || 1;
    this.itemModel.unitPrice = Number(item.unitPrice) || 0;
    this.itemModel.isTaxable = item.isTaxable ?? true;
    this.clearMessages();
    this.sheet.set('edit');
  }

  closeSheet(): void {
    this.sheet.set('none');
  }

  setItemType(type: string): void {
    this.itemModel.itemType = type;
  }

  selectCatalogItem(item: CatalogItem): void {
    this.itemModel.itemName = item.name;
    this.itemModel.unitPrice = item.price ?? 0;
    this.itemModel.isTaxable = item.isTaxable;
    this.itemModel.itemType = item.type;
  }

  get sheetTotal(): number {
    return (Number(this.itemModel.quantity) || 0) * (Number(this.itemModel.unitPrice) || 0);
  }

  submitSheet(): void {
    if (this.editingId) this.saveEditedItem();
    else this.addItem();
  }

  private addItem(): void {
    this.clearMessages();
    const name = this.itemModel.itemName.trim();
    if (!name) { this.errorMessage.set('Enter a name for the line item.'); return; }
    const body = this.toRequest();
    this.adding.set(true);
    this.service.addLineItem(this.tenantId, this.quoteId(), body).subscribe({
      next: () => {
        this.adding.set(false);
        this.sheet.set('none');
        this.refresh();
        this.successMessage.set('Line item added.');
      },
      error: (err) => { this.adding.set(false); this.errorMessage.set(this.formatError(err, 'Failed to add line item.')); }
    });
  }

  private saveEditedItem(): void {
    if (!this.editingId) return;
    this.clearMessages();
    const name = this.itemModel.itemName.trim();
    if (!name) { this.errorMessage.set('Enter a name for the line item.'); return; }
    const existing = this.items().find((i) => i.id === this.editingId);
    const body: LineItemRequest = { ...this.toRequest(), sortOrder: existing?.sortOrder ?? null };
    this.adding.set(true);
    this.service.updateLineItem(this.tenantId, this.quoteId(), this.editingId, body).subscribe({
      next: () => {
        this.adding.set(false);
        this.sheet.set('none');
        this.refresh();
        this.successMessage.set('Line item updated.');
      },
      error: (err) => { this.adding.set(false); this.errorMessage.set(this.formatError(err, 'Failed to update line item.')); }
    });
  }

  removeEditedItem(): void {
    if (!this.editingId) return;
    const id = this.editingId;
    this.clearMessages();
    this.adding.set(true);
    this.service.deleteLineItem(this.tenantId, this.quoteId(), id).subscribe({
      next: () => {
        this.adding.set(false);
        this.sheet.set('none');
        this.refresh();
        this.successMessage.set('Line item removed.');
      },
      error: (err) => { this.adding.set(false); this.errorMessage.set(this.formatError(err, 'Failed to remove line item.')); }
    });
  }

  private toRequest(): LineItemRequest {
    return {
      itemName: this.itemModel.itemName.trim(),
      itemType: this.itemModel.itemType || 'custom',
      description: this.itemModel.description?.trim() || null,
      quantity: Number(this.itemModel.quantity) || 0,
      unitPrice: Number(this.itemModel.unitPrice) || 0,
      isTaxable: this.itemModel.isTaxable
    };
  }

  rowTotal(item: QuoteLineItem): number {
    return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }

  // ── Drag to reorder (desktop) ──────────────────────
  onDragStart(index: number): void { if (!this.isReadOnly()) this.dragIndex.set(index); }
  onDragOver(event: DragEvent): void { event.preventDefault(); }
  onDragEnd(): void { this.dragIndex.set(null); }

  onDrop(targetIndex: number): void {
    const from = this.dragIndex();
    this.dragIndex.set(null);
    if (from === null || from === targetIndex || this.isReadOnly()) return;
    const reordered = [...this.items()];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(targetIndex, 0, moved);
    this.items.set(reordered);
    this.service.reorderLineItems(this.tenantId, this.quoteId(), reordered.map((i) => i.id)).subscribe({
      next: () => this.refresh(),
      error: (err) => { this.errorMessage.set(this.formatError(err, 'Failed to save order.')); this.refresh(); }
    });
  }

  // ── Save / preview / finalize ──────────────────────
  private persistDraft() {
    return this.service.updateQuote(this.tenantId, this.inquiryId(), this.quoteId(), { notes: this.notes, status: null });
  }

  saveDraft(): void {
    this.clearMessages();
    this.sharing.set(true);
    this.persistDraft().subscribe({
      next: (q) => { this.sharing.set(false); this.quote.set(q); this.successMessage.set('Draft saved.'); },
      error: (err) => { this.sharing.set(false); this.errorMessage.set(this.formatError(err, 'Failed to save draft.')); }
    });
  }

  saveAndPreview(): void {
    this.clearMessages();
    this.sharing.set(true);
    this.persistDraft().subscribe({
      next: (q) => {
        this.sharing.set(false);
        this.quote.set(q);
        this.view.set('review');
        window.scrollTo({ top: 0 });
      },
      error: (err) => { this.sharing.set(false); this.errorMessage.set(this.formatError(err, 'Failed to save quote.')); }
    });
  }

  backToEdit(): void {
    this.view.set('build');
    window.scrollTo({ top: 0 });
  }

  openFinalizeSheet(): void {
    if (!this.canFinalize()) {
      this.showValidation.set(true);
      this.view.set('build');
      window.scrollTo({ top: 0 });
      return;
    }
    this.showValidation.set(false);
    this.sheet.set('finalize');
  }

  confirmFinalize(): void {
    this.clearMessages();
    this.finalizing.set(true);
    this.service.updateQuote(this.tenantId, this.inquiryId(), this.quoteId(), { notes: this.notes, status: 'final' }).subscribe({
      next: (q) => {
        this.quote.set(q);
        this.service.share(this.tenantId, this.quoteId()).subscribe({
          next: (res) => {
            this.finalizing.set(false);
            this.sheet.set('none');
            this.shareUrl.set(this.buildShareUrl(res.shareToken));
            this.sentAt.set(new Date());
            this.view.set('sent');
            window.scrollTo({ top: 0 });
            this.refresh();
          },
          error: (err) => { this.finalizing.set(false); this.errorMessage.set(this.formatError(err, 'Quote finalized, but the share link failed.')); }
        });
      },
      error: (err) => { this.finalizing.set(false); this.sheet.set('none'); this.errorMessage.set(this.formatError(err, 'Failed to finalize quote.')); }
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

  openSharedQuote(): void {
    const url = this.shareUrl();
    if (url) window.open(url, '_blank');
  }

  goToInquiry(): void {
    this.router.navigate(['/inquiries', this.inquiryId()]);
  }

  private buildShareUrl(token: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/quotes/preview/${token}`;
  }

  private emptyItemModel(): ItemModel {
    return { itemName: '', itemType: 'hall', description: '', quantity: 1, unitPrice: 0, isTaxable: true };
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
