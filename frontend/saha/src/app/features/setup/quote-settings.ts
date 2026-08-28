import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { QuoteSettingsService } from './quote-settings.service';

@Component({
  selector: 'app-quote-settings',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './quote-settings.html'
})
export class QuoteSettingsPage implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(QuoteSettingsService);
  private authService = inject(AuthService);
  private translateService = inject(TranslateService);

  get tenantId(): string {
    return this.authService.getTenantId();
  }

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    vatRate: [15 as number | null, [Validators.min(0), Validators.max(100)]],
    validityDays: [7 as number | null, [Validators.min(0)]],
    quotePrefix: ['QT', [Validators.maxLength(255)]],
    defaultTerms: [''],
    footerText: [''],
    enablePdfBranding: [true],
    allowManualDiscount: [false]
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.get(this.tenantId).subscribe({
      next: (s) => {
        this.form.reset({
          vatRate: s.vatRate ?? null,
          validityDays: s.validityDays ?? null,
          quotePrefix: s.quotePrefix ?? '',
          defaultTerms: s.defaultTerms ?? '',
          footerText: s.footerText ?? '',
          enablePdfBranding: s.enablePdfBranding ?? true,
          allowManualDiscount: s.allowManualDiscount ?? false
        });
        this.loading.set(false);
      },
      error: (err) => { this.errorMessage.set(this.formatError(err, 'Failed to load quote settings.')); this.loading.set(false); }
    });
  }

  save(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service.save(this.tenantId, {
      vatRate: v.vatRate ?? null,
      validityDays: v.validityDays ?? null,
      quotePrefix: v.quotePrefix?.trim() || null,
      defaultTerms: v.defaultTerms?.trim() || null,
      footerText: v.footerText?.trim() || null,
      enablePdfBranding: v.enablePdfBranding,
      allowManualDiscount: v.allowManualDiscount
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set(this.translateService.instant('quoteSettings.saved'));
      },
      error: (err) => { this.saving.set(false); this.errorMessage.set(this.formatError(err, 'Failed to save quote settings.')); }
    });
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}