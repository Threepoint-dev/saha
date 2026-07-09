import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { DataQualityReport, ExportType } from './export.model';
import { ExportService } from './export.service';

interface ExportItem {
  type: ExportType;
  label: string;
  description: string;
}

interface SummaryCard {
  label: string;
  value: string;
  ok: boolean;
}

const LAST_EXPORT_KEY = 'saha.export.lastExport';

@Component({
  selector: 'app-export',
  imports: [CommonModule],
  templateUrl: './export.html'
})
export class Export implements OnInit {
  private service = inject(ExportService);

  readonly tenantId = environment.tenantId;

  readonly exportItems: ExportItem[] = [
    { type: 'inquiries', label: 'Inquiries CSV', description: 'All inquiries with source & response times' },
    { type: 'quotes', label: 'Quotes CSV', description: 'Quotes with totals & validity' },
    { type: 'halls', label: 'Halls CSV', description: 'Halls, capacity & pricing' },
    { type: 'packages', label: 'Packages CSV', description: 'Event packages & pricing' },
    { type: 'addons', label: 'Add-ons CSV', description: 'Add-ons & pricing' }
  ];

  readonly downloading = signal<ExportType | null>(null);
  readonly exportError = signal<string | null>(null);
  readonly lastExports = signal<Record<string, string>>(this.readLastExports());

  readonly report = signal<DataQualityReport | null>(null);
  readonly qualityLoading = signal(false);
  readonly qualityError = signal<string | null>(null);

  readonly score = computed(() => this.report()?.score ?? 0);

  /** Progress-bar colour: green > 80, yellow 50-80, red < 50. */
  readonly scoreColor = computed(() => {
    const s = this.score();
    if (s > 80) return '#2e7d5b';
    if (s >= 50) return '#e0922f';
    return '#d14343';
  });

  readonly summaryCards = computed<SummaryCard[]>(() => {
    const r = this.report();
    if (!r) return [];
    const s = r.summary;
    return [
      { label: 'Hotel Profile', value: s.hotelsComplete ? 'Complete' : 'Incomplete', ok: s.hotelsComplete },
      { label: 'Halls', value: `${s.hallsCount}`, ok: s.hallsCount > 0 },
      { label: 'Packages', value: `${s.packagesCount}`, ok: s.packagesCount > 0 },
      { label: 'Add-ons', value: `${s.addonsCount}`, ok: s.addonsCount > 0 },
      { label: 'Source Channels', value: `${s.sourceChannelsCount}`, ok: s.sourceChannelsCount > 0 },
      { label: 'Quote Settings', value: s.quoteSettingsConfigured ? 'Configured' : 'Not set', ok: s.quoteSettingsConfigured }
    ];
  });

  ngOnInit(): void {
    this.loadQuality();
  }

  download(type: ExportType): void {
    this.downloading.set(type);
    this.exportError.set(null);
    this.service.downloadCsv(this.tenantId, type).subscribe({
      next: (blob) => {
        this.saveBlob(blob, `saha-${type}-${this.today()}.csv`);
        this.recordExport(type);
        this.downloading.set(null);
      },
      error: (err) => {
        this.exportError.set(this.formatError(err, `Failed to export ${type}.`));
        this.downloading.set(null);
      }
    });
  }

  loadQuality(): void {
    this.qualityLoading.set(true);
    this.qualityError.set(null);
    this.service.getDataQuality(this.tenantId).subscribe({
      next: (r) => {
        this.report.set(r);
        this.qualityLoading.set(false);
      },
      error: (err) => {
        this.qualityError.set(this.formatError(err, 'Failed to load data quality report.'));
        this.qualityLoading.set(false);
      }
    });
  }

  lastExportOf(type: ExportType): string | null {
    return this.lastExports()[type] ?? null;
  }

  formatDateTime(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('en-US');
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  private recordExport(type: ExportType): void {
    const next = { ...this.lastExports(), [type]: new Date().toISOString() };
    this.lastExports.set(next);
    try {
      localStorage.setItem(LAST_EXPORT_KEY, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable (private mode); the in-memory copy still updates.
    }
  }

  private readLastExports(): Record<string, string> {
    try {
      const raw = localStorage.getItem(LAST_EXPORT_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string }; message?: string };
    if (anyErr?.error?.message) return anyErr.error.message;
    if (anyErr?.message) return anyErr.message;
    return fallback;
  }
}
