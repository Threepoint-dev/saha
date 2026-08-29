import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { ResponseTimeAnalysis } from '../reporting.model';
import { ReportingService } from '../reporting.service';
import { AdminPageHeader } from '../../../shared/admin-page-header/admin-page-header';

@Component({
  selector: 'app-response-time-analysis',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, AdminPageHeader],
  templateUrl: './response-time-analysis.html'
})
export class ResponseTimeAnalysisPage implements OnInit {
  private service = inject(ReportingService);
  private authService = inject(AuthService);

  readonly data = signal<ResponseTimeAnalysis | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly maxBucketCount = computed(() => {
    const rows = this.data()?.distribution ?? [];
    return rows.length ? Math.max(...rows.map((r) => r.count), 1) : 1;
  });

  readonly maxConversionRate = computed(() => {
    const rows = this.data()?.conversionByBucket ?? [];
    return rows.length ? Math.max(...rows.map((r) => r.conversionRate), 1) : 1;
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const tenantId = this.authService.getTenantId();
    this.service.getResponseTimeAnalysis(tenantId).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: (err) => {
        this.errorMessage.set(this.formatError(err, 'Failed to load response time analysis.'));
        this.loading.set(false);
      }
    });
  }

  barWidth(value: number, max: number): string {
    if (max <= 0) return '0%';
    return `${Math.max(4, Math.round((value / max) * 100))}%`;
  }

  slaClass(sla: string): string {
    switch (sla) {
      case 'Fast': return 'bg-green-100 text-green-700';
      case 'Acceptable': return 'bg-blue-100 text-blue-700';
      case 'Slow': return 'bg-[#F7E7D6] text-[#B06D1A]';
      default: return 'bg-red-100 text-red-700'; // At Risk
    }
  }

  formatHours(hours: number | null): string {
    if (hours == null) return '—';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}