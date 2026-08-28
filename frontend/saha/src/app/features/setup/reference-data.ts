import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import {
  Addon,
  EventPackage,
  Hall,
  TabKey
} from './reference-data.model';
import { ReferenceDataService } from './reference-data.service';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-reference-data',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './reference-data.html'
})
export class ReferenceData implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ReferenceDataService);
  private authService = inject(AuthService);
  private translateService = inject(TranslateService);

  get tenantId(): string {
    return this.authService.getTenantId();
  }

  readonly activeTab = signal<TabKey>('halls');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly halls = signal<Hall[]>([]);
  readonly packages = signal<EventPackage[]>([]);
  readonly addons = signal<Addon[]>([]);

  readonly rowCount = computed(() => {
    switch (this.activeTab()) {
      case 'halls': return this.halls().length;
      case 'packages': return this.packages().length;
      case 'addons': return this.addons().length;
    }
  });

  readonly modalOpen = signal(false);
  readonly modalMode = signal<ModalMode>('create');
  readonly modalTab = signal<TabKey>('halls');
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);

  readonly hallForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    capacity: [null as number | null],
    basePrice: [null as number | null],
    defaultSetup: [''],
    shortCode: ['']
  });

  readonly packageForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    price: [null as number | null],
    isTaxable: [false]
  });

  readonly addonForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    price: [null as number | null],
    isTaxable: [false]
  });

  ngOnInit(): void {
    this.loadAll();
  }

  setTab(tab: TabKey): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private loadAll(): void {
    this.loadHalls();
    this.loadPackages();
    this.loadAddons();
  }

  private loadHalls(): void {
    this.loading.set(true);
    this.service.listHalls(this.tenantId).subscribe({
      next: (list) => { this.halls.set(list); this.loading.set(false); },
      error: (err) => { this.errorMessage.set(this.formatError(err, 'Failed to load halls.')); this.loading.set(false); }
    });
  }

  private loadPackages(): void {
    this.service.listPackages(this.tenantId).subscribe({
      next: (list) => this.packages.set(list),
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to load packages.'))
    });
  }

  private loadAddons(): void {
    this.service.listAddons(this.tenantId).subscribe({
      next: (list) => this.addons.set(list),
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to load add-ons.'))
    });
  }

  openCreate(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.modalMode.set('create');
    this.modalTab.set(this.activeTab());
    this.editingId.set(null);
    this.resetForm(this.activeTab());
    this.modalOpen.set(true);
  }

  openEditHall(hall: Hall): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.modalMode.set('edit');
    this.modalTab.set('halls');
    this.editingId.set(hall.id);
    this.hallForm.reset({
      name: hall.name,
      capacity: hall.capacity,
      basePrice: hall.basePrice,
      defaultSetup: hall.defaultSetup ?? '',
      shortCode: hall.shortCode ?? ''
    });
    this.modalOpen.set(true);
  }

  openEditPackage(pkg: EventPackage): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.modalMode.set('edit');
    this.modalTab.set('packages');
    this.editingId.set(pkg.id);
    this.packageForm.reset({
      name: pkg.name,
      description: pkg.description ?? '',
      price: pkg.price,
      isTaxable: pkg.isTaxable ?? false
    });
    this.modalOpen.set(true);
  }

  openEditAddon(addon: Addon): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.modalMode.set('edit');
    this.modalTab.set('addons');
    this.editingId.set(addon.id);
    this.addonForm.reset({
      name: addon.name,
      price: addon.price,
      isTaxable: addon.isTaxable ?? false
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (this.saving()) return;
    this.modalOpen.set(false);
    this.editingId.set(null);
  }

  private resetForm(tab: TabKey): void {
    if (tab === 'halls') {
      this.hallForm.reset({ name: '', capacity: null, basePrice: null, defaultSetup: '', shortCode: '' });
    } else if (tab === 'packages') {
      this.packageForm.reset({ name: '', description: '', price: null, isTaxable: false });
    } else {
      this.addonForm.reset({ name: '', price: null, isTaxable: false });
    }
  }

  submit(): void {
    const tab = this.modalTab();
    if (tab === 'halls') this.submitHall();
    else if (tab === 'packages') this.submitPackage();
    else this.submitAddon();
  }

  private submitHall(): void {
    if (this.hallForm.invalid) { this.hallForm.markAllAsTouched(); return; }
    const v = this.hallForm.getRawValue();
    const body = {
      name: v.name,
      capacity: v.capacity ?? null,
      basePrice: v.basePrice ?? null,
      defaultSetup: v.defaultSetup || null,
      shortCode: v.shortCode || null
    };
    this.saving.set(true);
    const editingId = this.editingId();
    const call = editingId
      ? this.service.updateHall(this.tenantId, editingId, body)
      : this.service.createHall(this.tenantId, body);
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.loadHalls();
        this.successMessage.set(this.translateService.instant(editingId ? 'referenceData.hallUpdated' : 'referenceData.hallCreated'));
      },
      error: (err) => { this.saving.set(false); this.errorMessage.set(this.formatError(err, 'Failed to save hall.')); }
    });
  }

  private submitPackage(): void {
    if (this.packageForm.invalid) { this.packageForm.markAllAsTouched(); return; }
    const v = this.packageForm.getRawValue();
    const body = {
      name: v.name,
      description: v.description || null,
      price: v.price ?? null,
      isTaxable: v.isTaxable
    };
    this.saving.set(true);
    const editingId = this.editingId();
    const call = editingId
      ? this.service.updatePackage(this.tenantId, editingId, body)
      : this.service.createPackage(this.tenantId, body);
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.loadPackages();
        this.successMessage.set(this.translateService.instant(editingId ? 'referenceData.packageUpdated' : 'referenceData.packageCreated'));
      },
      error: (err) => { this.saving.set(false); this.errorMessage.set(this.formatError(err, 'Failed to save package.')); }
    });
  }

  private submitAddon(): void {
    if (this.addonForm.invalid) { this.addonForm.markAllAsTouched(); return; }
    const v = this.addonForm.getRawValue();
    const body = {
      name: v.name,
      price: v.price ?? null,
      isTaxable: v.isTaxable
    };
    this.saving.set(true);
    const editingId = this.editingId();
    const call = editingId
      ? this.service.updateAddon(this.tenantId, editingId, body)
      : this.service.createAddon(this.tenantId, body);
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.loadAddons();
        this.successMessage.set(this.translateService.instant(editingId ? 'referenceData.addonUpdated' : 'referenceData.addonCreated'));
      },
      error: (err) => { this.saving.set(false); this.errorMessage.set(this.formatError(err, 'Failed to save add-on.')); }
    });
  }

  archiveHall(hall: Hall): void {
    const message = this.translateService.instant('referenceData.archiveConfirmHall', { name: hall.name });
    if (!confirm(message)) return;
    this.service.archiveHall(this.tenantId, hall.id).subscribe({
      next: () => { this.loadHalls(); this.successMessage.set(this.translateService.instant('referenceData.hallArchived')); },
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to archive hall.'))
    });
  }

  archivePackage(pkg: EventPackage): void {
    const message = this.translateService.instant('referenceData.archiveConfirmPackage', { name: pkg.name });
    if (!confirm(message)) return;
    this.service.archivePackage(this.tenantId, pkg.id).subscribe({
      next: () => { this.loadPackages(); this.successMessage.set(this.translateService.instant('referenceData.packageArchived')); },
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to archive package.'))
    });
  }

  archiveAddon(addon: Addon): void {
    const message = this.translateService.instant('referenceData.archiveConfirmAddon', { name: addon.name });
    if (!confirm(message)) return;
    this.service.archiveAddon(this.tenantId, addon.id).subscribe({
      next: () => { this.loadAddons(); this.successMessage.set(this.translateService.instant('referenceData.addonArchived')); },
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to archive add-on.'))
    });
  }

  modalTitle(): string {
    const action = this.translateService.instant(this.modalMode() === 'create' ? 'referenceData.modal.add' : 'referenceData.modal.edit');
    const labelKey = this.modalTab() === 'halls' ? 'referenceData.modal.hallLabel'
      : this.modalTab() === 'packages' ? 'referenceData.modal.packageLabel'
      : 'referenceData.modal.addonLabel';
    const label = this.translateService.instant(labelKey);
    return `${action} ${label}`;
  }

  /** Translation key for the current tab's "+ Add ___" button. */
  addButtonKey(): string {
    return `referenceData.addButton.${this.activeTab()}`;
  }

  formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { status?: number; error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}