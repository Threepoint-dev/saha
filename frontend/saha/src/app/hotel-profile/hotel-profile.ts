import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../core/services/auth.service';
import { HotelProfileService } from './hotel-profile.service';
import { HotelProfile as HotelProfileData } from './hotel-profile.model';

@Component({
  selector: 'app-hotel-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hotel-profile.html'
})
export class HotelProfile implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(HotelProfileService);
  private authService = inject(AuthService);

  get tenantId(): string {
    return this.authService.getTenantId();
  }
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly logoPreviewUrl = signal<string | null>(null);
  selectedLogoFile: File | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    address: [''],
    city: [''],
    district: [''],
    phone: [''],
    logoUrl: [''],
    quoteFooterText: [''],
    termsNotes: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.service.getProfile(this.tenantId).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(this.formatError(err, 'Failed to load hotel data.'));
        this.loading.set(false);
      }
    });
  }

  private applyProfile(profile: HotelProfileData): void {
    this.form.patchValue({
      name: profile.name ?? '',
      address: profile.address ?? '',
      city: profile.city ?? '',
      district: profile.district ?? '',
      phone: profile.phone ?? '',
      logoUrl: profile.logoUrl ?? '',
      quoteFooterText: profile.quoteFooterText ?? '',
      termsNotes: profile.termsNotes ?? '',
      isActive: profile.isActive ?? true
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedLogoFile = file;
    const prev = this.logoPreviewUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.logoPreviewUrl.set(URL.createObjectURL(file));
  }

  toggleActive(): void {
    const current = this.form.controls.isActive.value;
    this.form.controls.isActive.setValue(!current);
    this.form.controls.isActive.markAsDirty();
  }

  save(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please fill in the required fields.');
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.service.updateProfile(this.tenantId, {
      name: value.name,
      address: value.address || null,
      city: value.city || null,
      district: value.district || null,
      phone: value.phone || null,
      mainContactName: null,
      mainContactEmail: null,
      mainContactPhone: null,
      logoUrl: value.logoUrl || null,
      quoteFooterText: value.quoteFooterText || null,
      termsNotes: value.termsNotes || null,
      isActive: value.isActive
    }).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.saving.set(false);
        this.successMessage.set('Changes saved successfully.');
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(this.formatError(err, 'Failed to save changes.'));
      }
    });
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { status?: number; error?: { message?: string } };
    if (anyErr?.status === 404) {
      return 'Hotel data not found for this account.';
    }
    if (anyErr?.error?.message) {
      return anyErr.error.message;
    }
    return fallback;
  }
}