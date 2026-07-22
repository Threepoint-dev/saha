import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InquiryService, Inquiry } from '../../../core/services/inquiry.service';
import { SourceChannelsService } from '../../setup/source-channels.service';
import { SourceChannel } from '../../setup/source-channels.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-inquiry-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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

  lossReasons = [
    'Price too high',
    'Date unavailable',
    'Capacity / space',
    'No response from us',
    'Client went silent',
    'Chose a competitor',
    'Other'
  ];

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const tenantId = environment.tenantId;

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

  moveToContacted() {
    if (!this.inquiry?.id) return;
    this.inquiryService.updateStatus(this.inquiry.id, 'CONTACTED').subscribe({
      next: (data) => {
        this.inquiry = data;
        this.cdr.detectChanges();
      }
    });
  }

  markWon() {
    if (!this.inquiry?.id) return;
    this.inquiryService.updateStatus(this.inquiry.id, 'WON').subscribe({
      next: (data) => {
        this.inquiry = data;
        this.cdr.detectChanges();
      }
    });
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

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  formatDateShort(date: string): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  reassign(): void {
    alert('Reassign feature coming soon!');
  }
}