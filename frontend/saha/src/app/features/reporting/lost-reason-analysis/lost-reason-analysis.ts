import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { LostReasonAnalysis } from '../reporting.model';
import { ReportingService } from '../reporting.service';
import { AdminPageHeader } from '../../../shared/admin-page-header/admin-page-header';

@Component({
  selector: 'app-lost-reason-analysis',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, AdminPageHeader],
  templateUrl: './lost-reason-analysis.html'
})
export class LostReasonAnalysisPage implements OnInit {
  private service = inject(ReportingService);
  private authService = inject(AuthService);

  readonly data = signal<LostReasonAnalysis | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly maxCount = computed(() => {
    const rows = this.data()?.breakdown ?? [];
    return rows.length ? Math.max(...rows.map((r) => r.count)) : 0;
  });

  readonly maxWeekCount = computed(() => {
    const rows = this.data()?.trend ?? [];
    return rows.length ? Math.max(...rows.map((r) => r.count), 1) : 1;
  });

  readonly totalValueLost = computed(() => {
    const rows = this.data()?.breakdown ?? [];
    return rows.reduce((sum, r) => sum + (r.estimatedValueLost || 0), 0);
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const tenantId = this.authService.getTenantId();
    this.service.getLostReasonAnalysis(tenantId).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: (err) => {
        this.errorMessage.set(this.formatError(err, 'Failed to load lost reason analysis.'));
        this.loading.set(false);
      }
    });
  }

  barWidth(value: number, max: number): string {
    if (max <= 0) return '0%';
    return `${Math.max(4, Math.round((value / max) * 100))}%`;
  }

  urgencyClass(urgency: string): string {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Medium': return 'bg-[#F7E7D6] text-[#B06D1A]';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  formatSar(value: number): string {
    return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} SAR`;
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}