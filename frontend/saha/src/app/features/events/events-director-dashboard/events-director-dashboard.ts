import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { EventsDirectorDashboard } from '../events.model';
import { EventsService } from '../events.service';

@Component({
  selector: 'app-events-director-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events-director-dashboard.html'
})
export class EventsDirectorDashboardPage implements OnInit {
  private service = inject(EventsService);
  private authService = inject(AuthService);

  readonly data = signal<EventsDirectorDashboard | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly maxHallRevenue = computed(() => {
    const rows = this.data()?.revenueByHall ?? [];
    return rows.length ? Math.max(...rows.map((r) => r.valueSar)) : 0;
  });

  readonly maxSetupTypeCount = computed(() => {
    const rows = this.data()?.requestsBySetupType ?? [];
    return rows.length ? Math.max(...rows.map((r) => r.count)) : 0;
  });

  readonly maxMonthCount = computed(() => {
    const rows = this.data()?.monthlyTrend ?? [];
    return rows.length ? Math.max(...rows.map((r) => r.count), 1) : 1;
  });

  ngOnInit(): void {
    this.loading.set(true);
    const tenantId = this.authService.getTenantId();
    this.service.getDirectorDashboard(tenantId).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: (err) => {
        this.errorMessage.set(this.formatError(err, 'Failed to load the dashboard.'));
        this.loading.set(false);
      }
    });
  }

  barWidth(value: number, max: number): string {
    if (max <= 0) return '0%';
    return `${Math.max(4, Math.round((value / max) * 100))}%`;
  }

  formatSar(value: number): string {
    return `SAR ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}