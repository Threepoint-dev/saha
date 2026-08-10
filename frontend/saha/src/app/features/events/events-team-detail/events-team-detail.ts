import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { EventsTeamRequestDetail, PREPARATION_STATUSES } from '../events.model';
import { EventsService } from '../events.service';

@Component({
  selector: 'app-events-team-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events-team-detail.html'
})
export class EventsTeamDetailPage implements OnInit {
  private service = inject(EventsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  readonly preparationStatuses = PREPARATION_STATUSES;

  readonly detail = signal<EventsTeamRequestDetail | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  selectedStatus = '';
  opsNote = '';
  layoutElements: { type: string; x: number; y: number }[] = [];

  ngOnInit(): void {
    const inquiryId = this.route.snapshot.paramMap.get('inquiryId');
    if (inquiryId) {
      this.load(inquiryId);
    }
  }

  private load(inquiryId: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const tenantId = this.authService.getTenantId();
    this.service.getTeamRequestDetail(tenantId, inquiryId).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.selectedStatus = d.preparationStatus;
        this.opsNote = d.opsNotes ?? '';
        this.layoutElements = this.parseLayoutDesign(d.layoutDesign);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(this.formatError(err, 'Failed to load this event request.'));
        this.loading.set(false);
      }
    });
  }

  markPrepared(): void {
    this.selectedStatus = 'prepared';
    this.save();
  }

  save(): void {
    const d = this.detail();
    if (!d) return;
    this.saving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    const tenantId = this.authService.getTenantId();
    this.service.updatePreparationStatus(tenantId, d.inquiryId, {
      preparationStatus: this.selectedStatus,
      opsNotes: this.opsNote
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set('Saved.');
        this.load(d.inquiryId);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(this.formatError(err, 'Failed to save.'));
      }
    });
  }

  back(): void {
    this.router.navigate(['/events']);
  }

  statusLabel(status: string): string {
    return this.preparationStatuses.find((s) => s.value === status)?.label ?? status;
  }

  private parseLayoutDesign(raw: string | null): { type: string; x: number; y: number }[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}