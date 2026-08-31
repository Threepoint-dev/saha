import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { AdminPageHeader } from '../../shared/admin-page-header/admin-page-header';
import { DataQualityReport, ExportType } from './export.model';
import { ExportService } from './export.service';

interface ExportItem {
  type: ExportType;
  labelKey: string;
  descriptionKey: string;
}

interface SummaryCard {
  labelKey: string;
  value: string;
  valueIsKey: boolean;
  ok: boolean;
}

const LAST_EXPORT_KEY = 'saha.export.lastExport';

@Component({
  selector: 'app-export',
  imports: [CommonModule, TranslatePipe, AdminPageHeader],
  templateUrl: './export.html'
})
export class Export implements OnInit {
  private service = inject(ExportService);
  private authService = inject(AuthService);
  private translateService = inject(TranslateService);

  get tenantId(): string {
    return this.authService.getTenantId();
  }

  readonly exportItems: ExportItem[] = [
    { type: 'inquiries', labelKey: 'export.items.inquiries.label', descriptionKey: 'export.items.inquiries.description' },
    { type: 'quotes', labelKey: 'export.items.quotes.label', descriptionKey: 'export.items.quotes.description' },
    { type: 'halls', labelKey: 'export.items.halls.label', descriptionKey: 'export.items.halls.description' },
    { type: 'packages', labelKey: 'export.items.packages.label', descriptionKey: 'export.items.packages.description' },
    { type: 'addons', labelKey: 'export.items.addons.label', descriptionKey: 'export.items.addons.description' }
  ];

  readonly downloading = signal<ExportType | null>(null);
  readonly exportError = signal<string | null>(null);
  readonly lastExports = signal<Record<string, string>>(this.readLastExports());

  readonly report = signal<DataQualityReport | null>(null);
  readonly qualityLoading = signal(false);
  readonly qualityError = signal<string | null>(null);

  readonly score = computed(() => this.report()?.score ?? 0);

  private get locale(): string {
    return this.translateService.currentLang() === 'ar' ? 'ar-SA' : 'en-US';
  }

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
      { labelKey: 'export.summaryCard.hotelProfile', value: s.hotelsComplete ? 'export.complete' : 'export.incomplete', valueIsKey: true, ok: s.hotelsComplete },
      { labelKey: 'export.summaryCard.halls', value: `${s.hallsCount}`, valueIsKey: false, ok: s.hallsCount > 0 },
      { labelKey: 'export.summaryCard.packages', value: `${s.packagesCount}`, valueIsKey: false, ok: s.packagesCount > 0 },
      { labelKey: 'export.summaryCard.addons', value: `${s.addonsCount}`, valueIsKey: false, ok: s.addonsCount > 0 },
      { labelKey: 'export.summaryCard.sourceChannels', value: `${s.sourceChannelsCount}`, valueIsKey: false, ok: s.sourceChannelsCount > 0 },
      { labelKey: 'export.summaryCard.quoteSettings', value: s.quoteSettingsConfigured ? 'export.configured' : 'export.notSet', valueIsKey: true, ok: s.quoteSettingsConfigured }
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
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(this.locale);
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