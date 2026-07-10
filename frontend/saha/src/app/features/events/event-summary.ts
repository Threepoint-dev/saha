import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { EventSummary } from './events.model';
import { EventsService } from './events.service';

@Component({
  selector: 'app-event-summary',
  imports: [CommonModule],
  templateUrl: './event-summary.html'
})
export class EventSummaryPage implements OnInit {
  private service = inject(EventsService);
  private route = inject(ActivatedRoute);

  readonly summary = signal<EventSummary | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  ngOnInit(): void {
    const inquiryId = this.route.snapshot.paramMap.get('inquiryId') ?? '';
    this.service.getPublicSummary(inquiryId).subscribe({
      next: (s) => { this.summary.set(s); this.loading.set(false); },
      error: () => { this.notFound.set(true); this.loading.set(false); }
    });
  }

  print(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
