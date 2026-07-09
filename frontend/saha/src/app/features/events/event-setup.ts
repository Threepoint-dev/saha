import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import {
  Addon,
  CATERING_STYLES,
  EventAddon,
  EventSetup,
  EventSetupRequest,
  Hall,
  InquirySummary,
  SETUP_TYPES
} from './events.model';
import { EventsService } from './events.service';

@Component({
  selector: 'app-event-setup',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './event-setup.html'
})
export class EventSetupPage implements OnInit {
  private service = inject(EventsService);
  private route = inject(ActivatedRoute);

  readonly tenantId = environment.tenantId;
  readonly inquiryId = signal<string>('');

  readonly setupTypes = SETUP_TYPES;
  readonly cateringStyles = CATERING_STYLES;

  readonly inquiry = signal<InquirySummary | null>(null);
  readonly halls = signal<Hall[]>([]);
  readonly addons = signal<Addon[]>([]);
  readonly setup = signal<EventSetup | null>(null);
  readonly eventAddons = signal<EventAddon[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly addingAddon = signal(false);
  readonly confirming = signal(false);
  readonly copied = signal(false);
  readonly summaryUrl = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  form: EventSetupRequest = this.emptyForm();

  addAddonModel = { addonId: '', quantity: 1 };

  ngOnInit(): void {
    this.inquiryId.set(this.route.snapshot.paramMap.get('inquiryId') ?? '');

    this.service.getInquiry(this.tenantId, this.inquiryId()).subscribe({
      next: (i) => { this.inquiry.set(i); this.prefillFromInquiry(); },
      error: () => this.inquiry.set(null)
    });
    this.service.listHalls(this.tenantId).subscribe({
      next: (h) => this.halls.set(h),
      error: () => this.halls.set([])
    });
    this.service.listAddons(this.tenantId).subscribe({
      next: (a) => this.addons.set(a),
      error: () => this.addons.set([])
    });

    this.loadSetup();
  }

  private loadSetup(): void {
    this.loading.set(true);
    this.service.getEventSetup(this.tenantId, this.inquiryId()).subscribe({
      next: (s) => {
        this.setup.set(s);
        this.form = this.toForm(s);
        this.loading.set(false);
        this.loadEventAddons();
      },
      error: (err) => {
        // 404 simply means no setup exists yet — start with a blank form.
        this.setup.set(null);
        this.loading.set(false);
        if (err?.status && err.status !== 404) {
          this.errorMessage.set(this.formatError(err, 'Failed to load event setup.'));
        }
      }
    });
  }

  private loadEventAddons(): void {
    const s = this.setup();
    if (!s) return;
    this.service.listEventAddons(this.tenantId, s.id).subscribe({
      next: (list) => this.eventAddons.set(list),
      error: () => this.eventAddons.set([])
    });
  }

  private prefillFromInquiry(): void {
    // Only seed a brand-new form (no saved setup yet) from the inquiry basics.
    if (this.setup()) return;
    const i = this.inquiry();
    if (!i) return;
    if (this.form.eventDate == null) this.form.eventDate = i.eventDate;
    if (this.form.guestCount == null) this.form.guestCount = i.guestCount;
  }

  recomputeDuration(): void {
    const start = this.form.startTime;
    const end = this.form.endTime;
    if (!start || !end) return;
    const startMin = this.toMinutes(start);
    const endMin = this.toMinutes(end);
    if (startMin == null || endMin == null) return;
    let diff = endMin - startMin;
    if (diff < 0) diff += 24 * 60; // wrap past midnight
    this.form.durationHours = Math.round(diff / 60);
  }

  save(): void {
    this.clearMessages();
    this.saving.set(true);
    const body = { ...this.form };
    const existing = this.setup();
    const request$ = existing
      ? this.service.updateEventSetup(this.tenantId, this.inquiryId(), body)
      : this.service.createEventSetup(this.tenantId, this.inquiryId(), body);
    request$.subscribe({
      next: (s) => {
        this.saving.set(false);
        this.setup.set(s);
        this.form = this.toForm(s);
        this.successMessage.set('Event setup saved.');
        this.loadEventAddons();
      },
      error: (err) => { this.saving.set(false); this.errorMessage.set(this.formatError(err, 'Failed to save event setup.')); }
    });
  }

  // --- Event add-ons ---
  addAddon(): void {
    this.clearMessages();
    const s = this.setup();
    if (!s) { this.errorMessage.set('Save the event setup before adding add-ons.'); return; }
    const addonId = this.addAddonModel.addonId;
    if (!addonId) { this.errorMessage.set('Choose an add-on first.'); return; }
    const quantity = Number(this.addAddonModel.quantity) || 1;
    this.addingAddon.set(true);
    this.service.addEventAddon(this.tenantId, s.id, { addonId, quantity }).subscribe({
      next: () => {
        this.addingAddon.set(false);
        this.addAddonModel = { addonId: '', quantity: 1 };
        this.loadEventAddons();
        this.successMessage.set('Add-on added.');
      },
      error: (err) => { this.addingAddon.set(false); this.errorMessage.set(this.formatError(err, 'Failed to add add-on.')); }
    });
  }

  updateAddonQty(addon: EventAddon): void {
    const s = this.setup();
    if (!s) return;
    const quantity = Number(addon.quantity) || 1;
    this.service.updateEventAddonQuantity(this.tenantId, s.id, addon.id, quantity).subscribe({
      next: () => this.loadEventAddons(),
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to update quantity.'))
    });
  }

  removeAddon(addon: EventAddon): void {
    const s = this.setup();
    if (!s) return;
    this.clearMessages();
    this.service.removeEventAddon(this.tenantId, s.id, addon.id).subscribe({
      next: () => this.loadEventAddons(),
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to remove add-on.'))
    });
  }

  addonName(id: string): string {
    return this.addons().find((a) => a.id === id)?.name ?? 'Add-on';
  }

  // --- Confirmation ---
  sendConfirmation(): void {
    this.clearMessages();
    this.confirming.set(true);
    // Persist the latest form first so the customer sees current details.
    const persist$ = this.setup()
      ? this.service.updateEventSetup(this.tenantId, this.inquiryId(), { ...this.form })
      : this.service.createEventSetup(this.tenantId, this.inquiryId(), { ...this.form });
    persist$.subscribe({
      next: (s) => {
        this.setup.set(s);
        this.form = this.toForm(s);
        this.service.confirm(this.tenantId, this.inquiryId()).subscribe({
          next: () => {
            this.confirming.set(false);
            this.summaryUrl.set(this.buildSummaryUrl());
            this.successMessage.set('Customer confirmation sent. Share the summary link below.');
          },
          error: (err) => { this.confirming.set(false); this.errorMessage.set(this.formatError(err, 'Failed to send confirmation.')); }
        });
      },
      error: (err) => { this.confirming.set(false); this.errorMessage.set(this.formatError(err, 'Failed to save before confirming.')); }
    });
  }

  copyLink(): void {
    const url = this.summaryUrl();
    if (!url) return;
    navigator.clipboard?.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  private buildSummaryUrl(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/events/summary/${this.inquiryId()}`;
  }

  private toForm(s: EventSetup): EventSetupRequest {
    return {
      quoteId: s.quoteId,
      hallId: s.hallId,
      setupType: s.setupType,
      layoutNotes: s.layoutNotes,
      guestCount: s.guestCount,
      banquetHeadcount: s.banquetHeadcount,
      cateringStyle: s.cateringStyle,
      mainMeal: s.mainMeal,
      startTime: this.trimTime(s.startTime),
      endTime: this.trimTime(s.endTime),
      durationHours: s.durationHours,
      eventDate: s.eventDate,
      chairColor: s.chairColor,
      tableColor: s.tableColor,
      agenda: s.agenda,
      internalNotes: s.internalNotes,
      opsNotes: s.opsNotes,
      attachmentUrl: s.attachmentUrl,
      preparationStatus: s.preparationStatus
    };
  }

  private emptyForm(): EventSetupRequest {
    return {
      quoteId: null, hallId: null, setupType: null, layoutNotes: null, guestCount: null,
      banquetHeadcount: null, cateringStyle: null, mainMeal: null, startTime: null, endTime: null,
      durationHours: null, eventDate: null, chairColor: null, tableColor: null, agenda: null,
      internalNotes: null, opsNotes: null, attachmentUrl: null, preparationStatus: null
    };
  }

  /** The API returns times as HH:mm:ss; the <input type="time"> wants HH:mm. */
  private trimTime(value: string | null): string | null {
    if (!value) return null;
    return value.length >= 5 ? value.substring(0, 5) : value;
  }

  private toMinutes(value: string): number | null {
    const parts = value.split(':');
    if (parts.length < 2) return null;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
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
