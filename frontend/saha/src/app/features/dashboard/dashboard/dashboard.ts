import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, RecentInquiry } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  inquiries: RecentInquiry[] = [];
  isLoading = true;

  get total() { return this.inquiries.length; }
  get newCount() { return this.inquiries.filter(i => i.status === 'NEW').length; }
  get contacted() { return this.inquiries.filter(i => i.status === 'CONTACTED').length; }
  get quoted() { return this.inquiries.filter(i => i.status === 'QUOTED').length; }
  get won() { return this.inquiries.filter(i => i.status === 'WON').length; }
  get lost() { return this.inquiries.filter(i => i.status === 'LOST').length; }

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.dashboardService.getInquiries().subscribe({
      next: (data) => {
        this.inquiries = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-700';
      case 'CONTACTED': return 'bg-yellow-100 text-yellow-700';
      case 'QUOTED': return 'bg-purple-100 text-purple-700';
      case 'WON': return 'bg-green-100 text-green-700';
      case 'LOST': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}