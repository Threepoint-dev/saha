import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { EventsTeamRequest } from '../events.model';
import { EventsService } from '../events.service';

type FilterTab = 'all' | 'new' | 'in_prep' | 'prepared';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events-list.html'
})
export class EventsList implements OnInit {
  private service = inject(EventsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly requests = signal<EventsTeamRequest[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly activeTab = signal<FilterTab>('all');

  readonly filtered = computed(() => {
    const tab = this.activeTab();
    if (tab === 'all') return this.requests();
    return this.requests().filter((r) => r.preparationStatus === tab);
  });

  readonly tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'in_prep', label: 'In Prep' },
    { key: 'prepared', label: 'Prepared' }
  ];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const tenantId = this.authService.getTenantId();
    this.service.listTeamRequests(tenantId).subscribe({
      next: (list) => { this.requests.set(list); this.loading.set(false); },
      error: (err) => { this.errorMessage.set(this.formatError(err, 'Failed to load event requests.')); this.loading.set(false); }
    });
  }

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
  }

  countFor(tab: FilterTab): number {
    if (tab === 'all') return this.requests().length;
    return this.requests().filter((r) => r.preparationStatus === tab).length;
  }

  view(request: EventsTeamRequest): void {
    this.router.navigate(['/events/requests', request.inquiryId]);
  }

  prep(request: EventsTeamRequest): void {
    this.router.navigate(['/events/requests', request.inquiryId]);
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'new': return 'New';
      case 'in_prep': return 'In Prep';
      case 'prepared': return 'Prepared';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'in_prep': return 'bg-[#FFF3DC] text-[#B37410]';
      case 'prepared': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  timeAgo(date: string | null): string {
    if (!date) return '—';
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { error?: { message?: string } };
    if (anyErr?.error?.message) return anyErr.error.message;
    return fallback;
  }
}