import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Readiness, ReadinessChecklistItem } from './readiness.model';
import { ReadinessService } from './readiness.service';

interface BadgeStyle {
  bg: string;
  border: string;
  text: string;
}

@Component({
  selector: 'app-readiness',
  imports: [CommonModule],
  templateUrl: './readiness.html'
})
export class PilotReadiness implements OnInit {
  private service = inject(ReadinessService);

  readonly tenantId = environment.tenantId;

  readonly readiness = signal<Readiness | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** The four readiness levels, in order, for the legend. */
  readonly levels = ['Not Ready', 'Almost Ready', 'Ready for Baseline', 'Ready for Live'];

  readonly checklist = computed<ReadinessChecklistItem[]>(() => this.readiness()?.checklist ?? []);
  readonly completeCount = computed(() => this.checklist().filter((i) => i.done).length);
  readonly pendingCount = computed(() => this.checklist().filter((i) => !i.done).length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.service.get(this.tenantId).subscribe({
      next: (r) => { this.readiness.set(r); this.loading.set(false); },
      error: (err) => { this.errorMessage.set(this.formatError(err, 'Failed to load readiness.')); this.loading.set(false); }
    });
  }

  /** Palette per readiness level (matches the SAHA Figma design). */
  levelStyle(level: string): BadgeStyle {
    switch (level) {
      case 'Not Ready':
        return { bg: '#f7dede', border: '#d14343', text: '#d14343' };
      case 'Almost Ready':
        return { bg: '#f7e7d6', border: '#e0922f', text: '#e0922f' };
      case 'Ready for Baseline':
        return { bg: '#d6edf5', border: '#2c7a8c', text: '#2c7a8c' };
      case 'Ready for Live':
        return { bg: '#dff0e8', border: '#2e7d5b', text: '#2e7d5b' };
      default:
        return { bg: '#efebf3', border: '#c9c3b8', text: '#55514a' };
    }
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}
