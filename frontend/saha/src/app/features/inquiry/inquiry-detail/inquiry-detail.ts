import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InquiryService, Inquiry } from '../../../core/services/inquiry.service';

@Component({
  selector: 'app-inquiry-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './inquiry-detail.html',
  styleUrl: './inquiry-detail.scss'
})
export class InquiryDetailComponent implements OnInit {
  inquiry: Inquiry | null = null;
  isLoading = true;
  showMarkLost = false;
  lossReason = '';
  lossNote = '';
  isSubmittingLost = false;

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
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
    if (!this.lossReason || !this.inquiry?.id) return;
    this.isSubmittingLost = true;
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
}