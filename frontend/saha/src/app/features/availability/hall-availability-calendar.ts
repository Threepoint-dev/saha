import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { Hall } from '../setup/reference-data.model';
import { ReferenceDataService } from '../setup/reference-data.service';
import { AvailabilityService, HallAvailabilityConflictError } from './availability.service';
import {
  BLOCK_STATUSES,
  BlockStatus,
  HallAvailabilityBlock,
  HallAvailabilityConflict,
  HallAvailabilityUpsertRequest
} from './availability.model';

interface DayCell {
  date: string;
  dayNumber: number;
}

/** Translation-key map — the displayed label always goes through the `translate` pipe now, not this text directly. */
const STATUS_KEYS: Record<string, string> = {
  tentative: 'availability.legend.tentative',
  confirmed: 'availability.legend.confirmed',
  blocked: 'availability.legend.blocked',
  maintenance: 'availability.legend.maintenance'
};

const STATUS_CLASSES: Record<string, string> = {
  tentative: 'bg-[#F7E7D6] text-[#B06D1A]',
  confirmed: 'bg-[#34203A] text-white',
  blocked: 'bg-[#F7DEDE] text-[#A02F2F]',
  maintenance: 'bg-[#E5E1E8] text-[#55514A]'
};

@Component({
  selector: 'app-hall-availability-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './hall-availability-calendar.html'
})
export class HallAvailabilityCalendar implements OnInit {
  private service = inject(AvailabilityService);
  private hallsService = inject(ReferenceDataService);
  private authService = inject(AuthService);
  private translateService = inject(TranslateService);

  get tenantId(): string {
    return this.authService.getTenantId();
  }

  readonly blockStatuses = BLOCK_STATUSES;

  readonly halls = signal<Hall[]>([]);
  readonly blocks = signal<HallAvailabilityBlock[]>([]);
  readonly hallFilter = signal<string>('');
  readonly monthStart = signal<Date>(this.startOfMonth(new Date()));

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Modal state
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly conflict = signal<HallAvailabilityConflict | null>(null);
  editingId: string | null = null;

  form: HallAvailabilityUpsertRequest = this.emptyForm();

  readonly filteredHalls = computed(() => {
    const filter = this.hallFilter();
    return filter ? this.halls().filter((h) => h.id === filter) : this.halls();
  });

  readonly days = computed<DayCell[]>(() => {
    const start = this.monthStart();
    const year = start.getFullYear();
    const month = start.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: DayCell[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date: this.toIsoDate(date), dayNumber: d });
    }
    return cells;
  });

  private get locale(): string {
    return this.translateService.currentLang() === 'ar' ? 'ar-SA' : 'en-US';
  }

  readonly monthLabel = computed(() =>
    this.monthStart().toLocaleDateString(this.locale, { month: 'long', year: 'numeric' })
  );

  ngOnInit(): void {
    this.hallsService.listHalls(this.tenantId).subscribe({
      next: (h) => this.halls.set(h),
      error: () => this.halls.set([])
    });
    this.loadBlocks();
  }

  private loadBlocks(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const start = this.monthStart();
    const from = this.toIsoDate(start);
    const to = this.toIsoDate(new Date(start.getFullYear(), start.getMonth() + 1, 0));
    this.service.list(this.tenantId, from, to, this.hallFilter() || null).subscribe({
      next: (list) => { this.blocks.set(list); this.loading.set(false); },
      error: (err) => { this.errorMessage.set(this.formatError(err, 'Failed to load the calendar.')); this.loading.set(false); }
    });
  }

  onFilterChange(): void {
    this.loadBlocks();
  }

  shiftMonth(delta: number): void {
    const start = this.monthStart();
    this.monthStart.set(new Date(start.getFullYear(), start.getMonth() + delta, 1));
    this.loadBlocks();
  }

  blockFor(hallId: string, date: string): HallAvailabilityBlock | undefined {
    return this.blocks().find((b) => b.hallId === hallId && b.eventDate === date);
  }

  /** Translation key for a status word, e.g. 'tentative' -> 'availability.legend.tentative'. */
  statusLabelKey(status: string | undefined): string {
    if (!status) return 'availability.legend.available';
    return STATUS_KEYS[status] ?? status;
  }

  statusClass(status: string | undefined): string {
    if (!status) return 'bg-[#E9F5EC] text-[#2E7D5B]';
    return STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600';
  }

  cellLabel(hallId: string, date: string): string {
    const block = this.blockFor(hallId, date);
    const key = this.statusLabelKey(block?.status);
    return this.translateService.instant(key);
  }

  // --- Modal ---
  openAddModal(hallId?: string, date?: string): void {
    this.editingId = null;
    this.conflict.set(null);
    this.form = this.emptyForm();
    if (hallId) this.form.hallId = hallId;
    if (date) this.form.eventDate = date;
    this.modalOpen.set(true);
  }

  openCell(hallId: string, date: string): void {
    const existing = this.blockFor(hallId, date);
    if (existing) {
      this.openEditModal(existing);
    } else {
      this.openAddModal(hallId, date);
    }
  }

  openEditModal(block: HallAvailabilityBlock): void {
    this.editingId = block.id;
    this.conflict.set(null);
    this.form = {
      hallId: block.hallId,
      eventDate: block.eventDate,
      startTime: block.startTime,
      endTime: block.endTime,
      status: block.status as BlockStatus,
      inquiryId: block.inquiryId,
      reason: block.reason,
      notes: block.notes,
      force: false
    };
    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (this.saving()) return;
    this.modalOpen.set(false);
  }

  save(): void {
    if (!this.form.hallId || !this.form.eventDate || !this.form.status) {
      this.errorMessage.set(this.translateService.instant('availability.requiredFields'));
      return;
    }
    this.errorMessage.set(null);
    this.conflict.set(null);
    this.saving.set(true);
    const currentUserId = null; // createdBy is optional; backend records it when supplied.
    const request$ = this.editingId
      ? this.service.update(this.tenantId, this.editingId, this.form)
      : this.service.create(this.tenantId, currentUserId, this.form);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.loadBlocks();
      },
      error: (err) => {
        this.saving.set(false);
        if (err instanceof HallAvailabilityConflictError) {
          this.conflict.set(err.conflict);
        } else {
          this.errorMessage.set(this.formatError(err, 'Failed to save the block.'));
        }
      }
    });
  }

  saveAnyway(): void {
    this.form.force = true;
    this.save();
  }

  deleteBlock(): void {
    if (!this.editingId) return;
    if (!confirm(this.translateService.instant('availability.confirmRemove'))) return;
    this.saving.set(true);
    this.service.delete(this.tenantId, this.editingId).subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.loadBlocks(); },
      error: (err) => { this.saving.set(false); this.errorMessage.set(this.formatError(err, 'Failed to remove block.')); }
    });
  }

  hallName(hallId: string): string {
    return this.halls().find((h) => h.id === hallId)?.name ?? '—';
  }

  private emptyForm(): HallAvailabilityUpsertRequest {
    return {
      hallId: this.hallFilter() || '',
      eventDate: this.toIsoDate(new Date()),
      startTime: null,
      endTime: null,
      status: 'tentative',
      inquiryId: null,
      reason: null,
      notes: null,
      force: false
    };
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string }; message?: string };
    if (anyErr?.error?.message) return anyErr.error.message;
    if (anyErr?.message) return anyErr.message;
    return fallback;
  }
}