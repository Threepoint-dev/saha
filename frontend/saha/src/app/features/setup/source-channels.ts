import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { SourceChannel } from './source-channels.model';
import { SourceChannelsService } from './source-channels.service';

@Component({
  selector: 'app-source-channels',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './source-channels.html'
})
export class SourceChannels implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(SourceChannelsService);

  readonly tenantId = environment.tenantId;

  readonly channels = signal<SourceChannel[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly dragIndex = signal<number | null>(null);

  readonly addForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]]
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.list(this.tenantId).subscribe({
      next: (list) => { this.channels.set(list); this.loading.set(false); },
      error: (err) => { this.errorMessage.set(this.formatError(err, 'Failed to load source channels.')); this.loading.set(false); }
    });
  }

  activeCount(): number {
    return this.channels().filter((c) => c.isActive).length;
  }

  addChannel(): void {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.clearMessages();
    const name = this.addForm.getRawValue().name.trim();
    const sortOrder = this.channels().length;
    this.saving.set(true);
    this.service.create(this.tenantId, { name, isActive: true, sortOrder }).subscribe({
      next: () => { this.saving.set(false); this.addForm.reset({ name: '' }); this.load(); this.successMessage.set('Channel added.'); },
      error: (err) => { this.saving.set(false); this.errorMessage.set(this.formatError(err, 'Failed to add channel.')); }
    });
  }

  toggleActive(channel: SourceChannel): void {
    this.clearMessages();
    const next = !channel.isActive;
    // optimistic update
    this.channels.update((list) => list.map((c) => c.id === channel.id ? { ...c, isActive: next } : c));
    this.service.update(this.tenantId, channel.id, {
      name: channel.name,
      isActive: next,
      sortOrder: channel.sortOrder
    }).subscribe({
      error: (err) => {
        this.channels.update((list) => list.map((c) => c.id === channel.id ? { ...c, isActive: channel.isActive } : c));
        this.errorMessage.set(this.formatError(err, 'Failed to update channel.'));
      }
    });
  }

  deleteChannel(channel: SourceChannel): void {
    this.clearMessages();
    const message = `Delete channel "${channel.name}"?\n\nIf this channel has been used in any inquiry it cannot be removed and will be deactivated instead.`;
    if (!confirm(message)) return;
    this.service.delete(this.tenantId, channel.id).subscribe({
      next: () => { this.load(); this.successMessage.set('Channel removed. If it was in use, it was deactivated instead.'); },
      error: (err) => this.errorMessage.set(this.formatError(err, 'Failed to delete channel.'))
    });
  }

  // --- Drag to reorder ---
  onDragStart(index: number): void {
    this.dragIndex.set(index);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(targetIndex: number): void {
    const from = this.dragIndex();
    this.dragIndex.set(null);
    if (from === null || from === targetIndex) return;
    const reordered = [...this.channels()];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(targetIndex, 0, moved);
    this.channels.set(reordered);
    this.persistOrder(reordered);
  }

  onDragEnd(): void {
    this.dragIndex.set(null);
  }

  private persistOrder(ordered: SourceChannel[]): void {
    this.clearMessages();
    const updates = ordered
      .map((channel, index) => ({ channel, index }))
      .filter(({ channel, index }) => channel.sortOrder !== index);
    if (updates.length === 0) return;
    this.saving.set(true);
    let remaining = updates.length;
    let failed = false;
    for (const { channel, index } of updates) {
      this.service.update(this.tenantId, channel.id, {
        name: channel.name,
        isActive: channel.isActive,
        sortOrder: index
      }).subscribe({
        next: () => { if (--remaining === 0) { this.saving.set(false); if (!failed) this.load(); } },
        error: (err) => {
          failed = true;
          this.errorMessage.set(this.formatError(err, 'Failed to save new order.'));
          if (--remaining === 0) { this.saving.set(false); this.load(); }
        }
      });
    }
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}
