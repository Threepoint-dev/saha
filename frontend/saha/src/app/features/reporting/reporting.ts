import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { ReportingSummary } from './reporting.model';
import { ReportingService } from './reporting.service';
import { SourceChannelsService } from '../setup/source-channels.service';

/** Chart.js is loaded globally via CDN (see index.html). */
declare const Chart: any;

interface Kpi {
  label: string;
  value: string;
  hint?: string;
  barColor?: string;
}

// SAHA house palette.
const PLUM = '#34203a';
const GOLD = '#f6ddae';
const STATUS_COLORS = ['#34203a', '#f6ddae', '#2e7d5b', '#d14343', '#e0922f', '#2c7a8c', '#8a6fa8'];

@Component({
  selector: 'app-reporting',
  imports: [CommonModule, FormsModule],
  templateUrl: './reporting.html'
})
export class Reporting implements OnInit, OnDestroy {
  private service = inject(ReportingService);
  private sourceChannelsService = inject(SourceChannelsService);

  readonly tenantId = environment.tenantId;

  readonly from = signal(this.isoDaysAgo(30));
  readonly to = signal(this.isoDaysAgo(0));

  readonly filterChannelId = signal('');
  readonly filterOwnerId = signal('');
  readonly filterEventType = signal('');
  readonly filterStatus = signal('');

  readonly summary = signal<ReportingSummary | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly sourceChannels = signal<any[]>([]);

  private charts: Record<string, any> = {};

  readonly kpis = computed<Kpi[]>(() => {
    const s = this.summary();
    if (!s) return [];
    return [
      { label: 'Total Inquiries', value: this.num(s.totalInquiries), hint: 'All inquiries received', barColor: 'bg-[#34203a]' },
      { label: 'New', value: this.num(s.newInquiries ?? 0), hint: 'Awaiting first contact', barColor: 'bg-[#4B9ED6]' },
      { label: 'Won', value: this.num(s.wonInquiries), hint: 'Confirmed bookings', barColor: 'bg-[#2E7D5B]' },
      { label: 'Lost', value: this.num(s.lostInquiries), hint: 'Closed without booking', barColor: 'bg-[#D14343]' },
      { label: 'Conversion Rate', value: `${(s.conversionRate ?? 0).toFixed(1)}%`, hint: 'Won ÷ (Won + Lost)', barColor: 'bg-[#ce8a28]' },
      { label: 'Median First Response', value: this.formatHours(s.avgResponseTimeHours), hint: 'median(first_response → created)', barColor: 'bg-[#E0922F]' },
      { label: 'Total Quote Value', value: this.currency(s.totalQuoteValue), hint: 'Sum of estimated value', barColor: 'bg-[#34203a]' },
    ];
  });

  readonly funnelBars = computed(() => {
    const s = this.summary();
    if (!s) return [];
    const statuses = [
      { label: 'New', count: s.newInquiries ?? 0, color: 'bg-[#4B9ED6]' },
      { label: 'Contacted', count: Math.max(0, s.totalInquiries - (s.newInquiries ?? 0) - s.wonInquiries - s.lostInquiries), color: 'bg-[#3d8f8a]' },
      { label: 'Quoted', count: 0, color: 'bg-[#ce8a28]' },
      { label: 'Won', count: s.wonInquiries, color: 'bg-[#2E7D5B]' },
      { label: 'Lost', count: s.lostInquiries, color: 'bg-[#D14343]' },
    ];
    const max = Math.max(...statuses.map(s => s.count), 1);
    return statuses.map(s => ({ ...s, height: Math.max(24, Math.round((s.count / max) * 120)) }));
  });

  ngOnInit(): void {
    this.sourceChannelsService.list(this.tenantId).subscribe({
      next: (channels) => {
        this.sourceChannels.set(channels);
      },
      error: (err) => console.error('Failed to load source channels:', err)
    });
    this.load();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  apply(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.service.getSummary(this.tenantId, { 
      from: this.from(), 
      to: this.to(),
      channelId: this.filterChannelId() || undefined,
      ownerId: this.filterOwnerId() || undefined,
      eventType: this.filterEventType() || undefined,
      status: this.filterStatus() || undefined
    }).subscribe({
      next: (s) => {
        this.summary.set(s);
        this.loading.set(false);
        // Defer so the *ngIf-guarded canvases exist in the DOM.
        setTimeout(() => this.renderCharts(s), 0);
      },
      error: (err) => {
        this.errorMessage.set(this.formatError(err, 'Failed to load reporting data.'));
        this.loading.set(false);
      }
    });
  }

  private renderCharts(s: ReportingSummary): void {
    if (typeof Chart === 'undefined') {
      return;
    }
    this.destroyCharts();

    this.charts['month'] = this.barChart(
      'chart-inquiries-month',
      s.inquiriesByMonth.map((m) => this.monthLabel(m.month)),
      s.inquiriesByMonth.map((m) => m.count),
      'Inquiries',
      PLUM
    );

    this.charts['quoteMonth'] = this.barChart(
      'chart-quote-month',
      s.quoteValueByMonth.map((m) => this.monthLabel(m.month)),
      s.quoteValueByMonth.map((m) => m.value),
      'Quote Value',
      GOLD,
      PLUM
    );

    this.charts['source'] = this.barChart(
      'chart-source',
      s.inquiriesBySource.map((x) => x.sourceName),
      s.inquiriesBySource.map((x) => x.count),
      'Inquiries',
      PLUM
    );

    this.charts['status'] = this.donutChart(
      'chart-status',
      s.inquiriesByStatus.map((x) => this.titleCase(x.status)),
      s.inquiriesByStatus.map((x) => x.count)
    );
  }

  private barChart(
    canvasId: string,
    labels: string[],
    data: number[],
    label: string,
    color: string,
    labelColor = '#55514a'
  ): any {
    const ctx = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!ctx) return null;
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            backgroundColor: color,
            borderColor: color === GOLD ? '#e2c489' : color,
            borderWidth: color === GOLD ? 1 : 0,
            borderRadius: 6,
            maxBarThickness: 48
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: labelColor } },
          y: { beginAtZero: true, ticks: { color: labelColor, precision: 0 }, grid: { color: '#efe9e0' } }
        }
      }
    });
  }

  private donutChart(canvasId: string, labels: string[], data: number[]): any {
    const ctx = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!ctx) return null;
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: labels.map((_, i) => STATUS_COLORS[i % STATUS_COLORS.length]),
            borderColor: '#faf7f2',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#55514a', padding: 14, usePointStyle: true } }
        }
      }
    });
  }

  private destroyCharts(): void {
    for (const key of Object.keys(this.charts)) {
      this.charts[key]?.destroy?.();
    }
    this.charts = {};
  }

  private monthLabel(key: string): string {
    // key is "YYYY-MM"
    const [year, month] = key.split('-');
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = Number(month) - 1;
    return idx >= 0 && idx < 12 ? `${names[idx]} ${year.slice(2)}` : key;
  }

  private titleCase(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }

  private num(value: number): string {
    return (value ?? 0).toLocaleString('en-US');
  }

  private currency(value: number): string {
    return (value ?? 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    });
  }

  private isoDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }

  formatHours(hours: number): string {
    if (!hours && hours !== 0) return '—';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
}
