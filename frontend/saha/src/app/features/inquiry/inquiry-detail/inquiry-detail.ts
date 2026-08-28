import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InquiryService, Inquiry } from '../../../core/services/inquiry.service';
import { SourceChannelsService } from '../../setup/source-channels.service';
import { SourceChannel } from '../../setup/source-channels.model';
import { AuthService } from '../../../core/services/auth.service';
import { QuotesService } from '../../quotes/quotes.service';
import { AvailabilityService } from '../../availability/availability.service';

@Component({
  selector: 'app-inquiry-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
  templateUrl: './inquiry-detail.html',
  styleUrl: './inquiry-detail.scss'
})
export class InquiryDetailComponent implements OnInit {
  inquiry: Inquiry | null = null;
  sourceChannels: SourceChannel[] = [];
  isLoading = true;
  showMarkLost = false;
  lossReason = '';
  lossNote = '';
  isSubmittingLost = false;
  showLostError = false;

  // Mark as Won — confirmation check
  showWonCheck = false;
  wonCheckLoading = false;
  wonCheckQuoteExists = false;
  wonCheckCustomerConfirmed = false;
  wonCheckHallStatus: string | null = null;
  markingWon = false;
  wonSuccess = false;

  /**
   * Values kept in English regardless of app language — this is what's
   * actually stored in the database as the inquiry's lossReason. Only the
   * button's *displayed* text is translated, via lossReasonLabelKey() below.
   */
  lossReasons = [
    'Price too high',
    'Date unavailable',
    'Capacity / space',
    'No response from us',
    'Client went silent',
    'Chose a competitor',
    'Other'
  ];

  private lossReasonKeyMap: Record<string, string> = {
    'Price too high': 'markLostModal.reasonOptions.priceTooHigh',
    'Date unavailable': 'markLostModal.reasonOptions.dateUnavailable',
    'Capacity / space': 'markLostModal.reasonOptions.capacitySpace',
    'No response from us': 'markLostModal.reasonOptions.noResponse',
    'Client went silent': 'markLostModal.reasonOptions.clientWentSilent',
    'Chose a competitor': 'markLostModal.reasonOptions.choseCompetitor',
    'Other': 'markLostModal.reasonOptions.other',
  };

  lossReasonLabelKey(reason: string): string {
    return this.lossReasonKeyMap[reason] || reason;
  }

  statusBadge: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    CONTACTED: 'bg-yellow-100 text-yellow-700',
    QUOTED: 'bg-purple-100 text-purple-700',
    WON: 'bg-green-100 text-green-700',
    LOST: 'bg-red-100 text-red-700',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inquiryService: InquiryService,
    private sourceChannelsService: SourceChannelsService,
    private authService: AuthService,
    private quotesService: QuotesService,
    private availabilityService: AvailabilityService,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const tenantId = this.authService.getTenantId();

    if (id) {
      this.sourceChannelsService.list(tenantId).subscribe({
        next: (channels) => {
          this.sourceChannels = channels;
          this.loadInquiry(id);
        },
        error: (err) => {
          console.error('Failed to load source channels', err);
          this.loadInquiry(id);
        }
      });
    }
  }

  private loadInquiry(id: string) {
    this.inquiryService.getById(id).subscribe({
      next: (data) => {
        this.inquiry = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getChannelName(sourceChannelId: string | undefined): string {
    if (!sourceChannelId) return '';
    const channel = this.sourceChannels.find(c => c.id === sourceChannelId);
    return channel ? channel.name : sourceChannelId;
  }

  /** Translation key for a status word, e.g. 'NEW' -> 'status.new'. */
  statusLabelKey(status: string | undefined): string {
    return `status.${(status || 'new').toLowerCase()}`;
  }

  moveToContacted() {
    if (!this.inquiry?.id) return;
    this.inquiryService.updateStatus(this.inquiry.id, 'CONTACTED').subscribe({
      next: (data) => {
        this.inquiry = data;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Mark as Won: confirmation check ---
  openWonCheck(): void {
    if (!this.inquiry?.id) return;
    this.showWonCheck = true;
    this.wonSuccess = false;
    this.wonCheckLoading = true;
    const tenantId = this.authService.getTenantId();
    const inquiryId = this.inquiry.id;

    this.wonCheckCustomerConfirmed = !!this.inquiry.customerConfirmedAt;

    this.quotesService.listQuotes(tenantId, inquiryId).subscribe({
      next: (quotes) => {
        this.wonCheckQuoteExists = quotes.length > 0;
        this.checkHallStatus(tenantId);
      },
      error: () => {
        this.wonCheckQuoteExists = false;
        this.checkHallStatus(tenantId);
      }
    });
  }

  private checkHallStatus(tenantId: string): void {
    const hallId = this.inquiry?.hallId;
    const eventDate = this.inquiry?.eventDate;
    if (!hallId || !eventDate) {
      this.wonCheckHallStatus = null;
      this.wonCheckLoading = false;
      this.cdr.detectChanges();
      return;
    }
    this.availabilityService.list(tenantId, eventDate, eventDate, hallId).subscribe({
      next: (blocks) => {
        this.wonCheckHallStatus = blocks.length > 0 ? blocks[0].status : 'available';
        this.wonCheckLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.wonCheckHallStatus = null;
        this.wonCheckLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goCompleteConfirmation(): void {
    if (!this.inquiry?.id) return;
    this.showWonCheck = false;
    this.router.navigate(['/events', this.inquiry.id]);
  }

  continueAsTentative(): void {
    this.showWonCheck = false;
  }

  confirmMarkWon(): void {
    if (!this.inquiry?.id) return;
    this.markingWon = true;
    this.inquiryService.updateStatus(this.inquiry.id, 'WON').subscribe({
      next: (data) => {
        this.inquiry = data;
        // Auto-share the Final Internal BEO with the Events Team now that the deal is Won.
        this.inquiryService.shareBeo(data.id!).subscribe({
          next: (shared) => {
            this.inquiry = shared;
            this.markingWon = false;
            this.wonSuccess = true;
            this.cdr.detectChanges();
          },
          error: () => {
            this.markingWon = false;
            this.wonSuccess = true; // Won succeeded even if the BEO share failed; surface it separately.
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.markingWon = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeWonCheck(): void {
    this.showWonCheck = false;
  }

  confirmMarkLost() {
    if (!this.lossReason) { this.showLostError = true; return; }
    if (!this.inquiry?.id) return;
    this.isSubmittingLost = true;
    this.showLostError = false;
    this.inquiryService.markLost(this.inquiry.id, this.lossReason, this.lossNote).subscribe({
      next: (data) => {
        this.inquiry = data;
        this.showMarkLost = false;
        this.isSubmittingLost = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSubmittingLost = false;
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  private get locale(): string {
    return this.translateService.currentLang() === 'ar' ? 'ar-SA' : 'en-US';
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(this.locale, {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  formatDateShort(date: string): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString(this.locale, { month: 'short', day: 'numeric' }) + ', ' +
      d.toLocaleTimeString(this.locale, { hour: 'numeric', minute: '2-digit' });
  }

  reassign(): void {
    alert('Reassign feature coming soon!');
  }
}