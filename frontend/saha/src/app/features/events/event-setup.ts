import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
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

/** Agenda segment stored as JSON in the `agenda` text field. */
export interface AgendaSegment {
  time: string;
  title: string;
  durationMinutes: number;
}

/** Layout element dropped onto the hall canvas (local-only UI state). */
export interface LayoutElement {
  type: string;
  x: number;
  y: number;
}

/** Setup-type card descriptor for the UI */
interface SetupTypeCard {
  value: string;
  icon: string;
  description: string;
}

/** Color swatch for table/chair color picker */
interface ColorSwatch {
  value: string;
  label: string;
  hex: string;
}

/** Catering style card */
interface CateringStyleCard {
  value: string;
  priceLabel: string;
}

/** Main meal option card */
interface MealCard {
  value: string;
  label: string;
  priceLabel: string;
}

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

  // ──────────────────────────────────────────────
  //  Section 1: Time slot buttons
  // ──────────────────────────────────────────────
  readonly timeSlots = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

  selectTimeSlot(slot: string): void {
    this.form.startTime = slot;
    // Auto-set end time based on duration or default +3h
    const dur = this.form.durationHours ?? 3;
    const startMin = this.toMinutes(slot);
    if (startMin != null) {
      const endMin = (startMin + dur * 60) % (24 * 60);
      const hh = String(Math.floor(endMin / 60)).padStart(2, '0');
      const mm = String(endMin % 60).padStart(2, '0');
      this.form.endTime = `${hh}:${mm}`;
    }
  }

  formatSlotLabel(slot: string): string {
    const [h, m] = slot.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  // ──────────────────────────────────────────────
  //  Section 2: Guest count stepper
  // ──────────────────────────────────────────────
  incrementGuests(): void {
    this.form.guestCount = (this.form.guestCount ?? 0) + 10;
  }
  decrementGuests(): void {
    const v = (this.form.guestCount ?? 0) - 10;
    this.form.guestCount = v < 0 ? 0 : v;
  }

  /** Returns hall capacity for the selected hall, if any */
  selectedHallCapacity(): number | null {
    if (!this.form.hallId) return null;
    const hall = this.halls().find(h => h.id === this.form.hallId);
    return hall?.capacity ?? null;
  }

  // ──────────────────────────────────────────────
  //  Section 3: Setup type cards
  // ──────────────────────────────────────────────
  readonly setupTypeCards: SetupTypeCard[] = SETUP_TYPES.map(t => ({
    value: t,
    icon: this.setupTypeIcon(t),
    description: this.setupTypeDesc(t)
  }));

  private setupTypeIcon(t: string): string {
    const icons: Record<string, string> = {
      'Banquet': '🍽️', 'Theater': '🎭', 'Classroom': '📚',
      'U-Shape': '🔲', 'Cocktail': '🍸', 'Custom': '⚙️'
    };
    return icons[t] ?? '📋';
  }

  private setupTypeDesc(t: string): string {
    const descs: Record<string, string> = {
      'Banquet': 'Round tables with formal dining setup',
      'Theater': 'Rows of chairs facing a stage',
      'Classroom': 'Tables with chairs in rows',
      'U-Shape': 'Tables arranged in a U formation',
      'Cocktail': 'Standing cocktail reception style',
      'Custom': 'Custom layout per your specifications'
    };
    return descs[t] ?? 'Custom arrangement';
  }

  selectSetupType(value: string): void {
    this.form.setupType = value;
  }

  // ──────────────────────────────────────────────
  //  Section 4: Color swatches
  // ──────────────────────────────────────────────
  readonly colorSwatches: ColorSwatch[] = [
    { value: 'Black', label: 'Black', hex: '#1a1a1a' },
    { value: 'Beige', label: 'Beige', hex: '#d4c5a9' },
    { value: 'Gray', label: 'Gray', hex: '#9e9e9e' },
    { value: 'Gold', label: 'Gold', hex: '#ce8a28' },
    { value: 'White', label: 'White', hex: '#f5f5f0' },
    { value: '', label: 'None', hex: 'transparent' }
  ];

  selectTableColor(value: string): void {
    this.form.tableColor = value || null;
  }
  selectChairColor(value: string): void {
    this.form.chairColor = value || null;
  }

  // ──────────────────────────────────────────────
  //  Section 5: Hall layout drag-and-drop
  // ──────────────────────────────────────────────
  readonly layoutChips = [
    'Round table', 'Rect table', 'Stage', 'Coffee break',
    'Entrance', 'AV area', 'Buffet', 'Registration'
  ];

  layoutElements: LayoutElement[] = [];
  draggingLayoutIndex: number | null = null;

  onChipDragStart(event: DragEvent, chipType: string): void {
    event.dataTransfer?.setData('text/plain', chipType);
    event.dataTransfer?.setData('source', 'chip');
  }

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    const chipType = event.dataTransfer?.getData('text/plain');
    const source = event.dataTransfer?.getData('source');
    if (!chipType) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (source === 'element' && this.draggingLayoutIndex !== null) {
      // Moving existing element
      this.layoutElements[this.draggingLayoutIndex].x = x;
      this.layoutElements[this.draggingLayoutIndex].y = y;
      this.draggingLayoutIndex = null;
    } else {
      // New chip dropped
      this.layoutElements.push({ type: chipType, x, y });
    }
  }

  onElementDragStart(event: DragEvent, index: number): void {
    this.draggingLayoutIndex = index;
    event.dataTransfer?.setData('text/plain', this.layoutElements[index].type);
    event.dataTransfer?.setData('source', 'element');
  }

  removeLayoutElement(index: number): void {
    this.layoutElements.splice(index, 1);
  }

  // ──────────────────────────────────────────────
  //  Section 6: Additional options (addons as selectable cards)
  // ──────────────────────────────────────────────
  selectedAddonIds: Set<string> = new Set();

  toggleAddonSelection(addonId: string): void {
    if (this.selectedAddonIds.has(addonId)) {
      this.selectedAddonIds.delete(addonId);
    } else {
      this.selectedAddonIds.add(addonId);
    }
  }

  isAddonSelected(addonId: string): boolean {
    return this.selectedAddonIds.has(addonId);
  }

  // ──────────────────────────────────────────────
  //  Section 7: Catering style cards & Main meal
  // ──────────────────────────────────────────────
  readonly cateringStyleCards: CateringStyleCard[] = CATERING_STYLES.map(c => ({
    value: c,
    priceLabel: this.cateringPrice(c)
  }));

  private cateringPrice(c: string): string {
    const prices: Record<string, string> = {
      'Full Service': 'SAR 150/person', 'Buffet': 'SAR 120/person',
      'Stations': 'SAR 100/person', 'None': 'No catering'
    };
    return prices[c] ?? '';
  }

  readonly mealCards: MealCard[] = [
    { value: '', label: 'None', priceLabel: '—' },
    { value: 'Breakfast', label: 'Breakfast', priceLabel: 'SAR 45/person' },
    { value: 'Lunch', label: 'Lunch', priceLabel: 'SAR 75/person' },
    { value: 'Dinner', label: 'Dinner', priceLabel: 'SAR 95/person' }
  ];

  selectCateringStyle(value: string): void {
    this.form.cateringStyle = value;
  }

  selectMainMeal(value: string): void {
    this.form.mainMeal = value || null;
  }

  incrementBanquetHeadcount(): void {
    this.form.banquetHeadcount = (this.form.banquetHeadcount ?? 0) + 10;
  }
  decrementBanquetHeadcount(): void {
    const v = (this.form.banquetHeadcount ?? 0) - 10;
    this.form.banquetHeadcount = v < 0 ? 0 : v;
  }

  // ──────────────────────────────────────────────
  //  Section 8: Event agenda segments
  // ──────────────────────────────────────────────
  agendaSegments: AgendaSegment[] = [];
  showAddSegment = false;
  newSegment: AgendaSegment = { time: '', title: '', durationMinutes: 30 };

  addAgendaSegment(): void {
    if (!this.newSegment.title.trim() || !this.newSegment.time) return;
    this.agendaSegments.push({ ...this.newSegment });
    this.newSegment = { time: '', title: '', durationMinutes: 30 };
    this.showAddSegment = false;
    this.syncAgendaToForm();
  }

  removeAgendaSegment(index: number): void {
    this.agendaSegments.splice(index, 1);
    this.syncAgendaToForm();
  }

  totalAgendaDuration(): number {
    return this.agendaSegments.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  }

  segmentEndTime(segment: AgendaSegment): string {
    const startMin = this.toMinutes(segment.time);
    if (startMin == null) return '';
    const endMin = (startMin + segment.durationMinutes) % (24 * 60);
    const hh = String(Math.floor(endMin / 60)).padStart(2, '0');
    const mm = String(endMin % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private syncAgendaToForm(): void {
    this.form.agenda = JSON.stringify(this.agendaSegments);
  }

  private parseAgendaFromForm(): void {
    if (!this.form.agenda) {
      this.agendaSegments = [];
      return;
    }
    try {
      const parsed = JSON.parse(this.form.agenda);
      if (Array.isArray(parsed)) {
        this.agendaSegments = parsed;
        return;
      }
    } catch {
      // Not JSON, keep as text — convert legacy free-text to a single segment
    }
    // Legacy: treat existing text as a single note segment
    if (this.form.agenda.trim()) {
      this.agendaSegments = [{ time: '00:00', title: this.form.agenda.trim(), durationMinutes: 0 }];
    } else {
      this.agendaSegments = [];
    }
  }

  // ──────────────────────────────────────────────
  //  Right column: summary helpers
  // ──────────────────────────────────────────────
  selectedHallName(): string {
    if (!this.form.hallId) return '—';
    return this.halls().find(h => h.id === this.form.hallId)?.name ?? '—';
  }

  selectedExtrasLabel(): string {
    const count = this.selectedAddonIds.size + this.eventAddons().length;
    return count > 0 ? `${count} selected` : '—';
  }

  // ──────────────────────────────────────────────
  //  Lifecycle
  // ──────────────────────────────────────────────
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
        this.parseAgendaFromForm();
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
    this.syncAgendaToForm();
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
        this.parseAgendaFromForm();
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
    this.syncAgendaToForm();
    this.confirming.set(true);
    // Persist the latest form first so the customer sees current details.
    const persist$ = this.setup()
      ? this.service.updateEventSetup(this.tenantId, this.inquiryId(), { ...this.form })
      : this.service.createEventSetup(this.tenantId, this.inquiryId(), { ...this.form });
    persist$.subscribe({
      next: (s) => {
        this.setup.set(s);
        this.form = this.toForm(s);
        this.parseAgendaFromForm();
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

  toMinutes(value: string): number | null {
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
