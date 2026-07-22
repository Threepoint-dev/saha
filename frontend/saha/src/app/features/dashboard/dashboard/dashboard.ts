import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService, RecentInquiry } from '../../../core/services/dashboard.service';
import { SourceChannelsService } from '../../setup/source-channels.service';
import { SourceChannel } from '../../setup/source-channels.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  inquiries: RecentInquiry[] = [];
  sourceChannels: SourceChannel[] = [];
  isLoading = true;
  searchQuery = '';

  get filteredInquiries(): RecentInquiry[] {
    if (!this.searchQuery) return this.inquiries;
    const lowerQuery = this.searchQuery.toLowerCase();
    return this.inquiries.filter(i => 
      i.clientName.toLowerCase().includes(lowerQuery) || 
      i.eventType?.toLowerCase().includes(lowerQuery)
    );
  }

  get total() { return this.inquiries.length; }
  get newCount() { return this.inquiries.filter(i => i.status === 'NEW').length; }
  get contacted() { return this.inquiries.filter(i => i.status === 'CONTACTED').length; }
  get quoted() { return this.inquiries.filter(i => i.status === 'QUOTED').length; }
  get won() { return this.inquiries.filter(i => i.status === 'WON').length; }
  get lost() { return this.inquiries.filter(i => i.status === 'LOST').length; }

  get winRate(): number {
    if (this.total === 0) return 0;
    return Math.round((this.won / this.total) * 100);
  }

  get lossRate(): number {
    if (this.total === 0) return 0;
    return Math.round((this.lost / this.total) * 100);
  }

  get currentMonth(): string {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // First response time — placeholder calculation (minutes median)
  get firstResponseMinutes(): number {
    // Real implementation would come from backend stats endpoint
    return 0;
  }

  get firstResponseDisplay(): string {
    if (this.firstResponseMinutes <= 0) return '—';
    const h = Math.floor(this.firstResponseMinutes / 60);
    const m = this.firstResponseMinutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  get sourceSummary(): { name: string; count: number; pct: number; color: string }[] {
    const sourceMap: Record<string, number> = {};
    for (const inq of this.inquiries) {
      // Map the UUID to the actual channel name
      let key = inq.sourceChannelId || 'Unknown';
      const channel = this.sourceChannels.find(c => c.id === key);
      if (channel) {
        key = channel.name;
      }
      sourceMap[key] = (sourceMap[key] || 0) + 1;
    }
    const colors = ['bg-[#34203A]', 'bg-[#E8A33D]', 'bg-[#2E7D5B]', 'bg-[#4A90D9]', 'bg-[#D14343]'];
    return Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({
        name,
        count,
        pct: this.total > 0 ? Math.round((count / this.total) * 100) : 0,
        color: colors[i % colors.length]
      }));
  }

  get lossReasonSummary(): { label: string; count: number; pct: number }[] {
    // Loss reasons would come from a dedicated backend endpoint; placeholder from status
    const lostCount = this.lost;
    if (lostCount === 0) return [];
    // Static placeholder labels matching Figma design
    return [
      { label: 'Price too high', count: Math.ceil(lostCount * 0.35), pct: 35 },
      { label: 'Date unavailable', count: Math.ceil(lostCount * 0.25), pct: 25 },
      { label: 'Chose competitor', count: Math.ceil(lostCount * 0.20), pct: 20 },
      { label: 'Capacity', count: Math.ceil(lostCount * 0.12), pct: 12 },
      { label: 'No response from us', count: Math.ceil(lostCount * 0.08), pct: 8 },
    ].filter(r => r.count > 0);
  }

  statusBadge: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    CONTACTED: 'bg-[#FFF3DC] text-[#B37410]',
    QUOTED: 'bg-purple-100 text-purple-700',
    WON: 'bg-green-100 text-green-700',
    LOST: 'bg-red-100 text-red-700',
  };

  constructor(
    private dashboardService: DashboardService,
    private sourceChannelsService: SourceChannelsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isLoading = true;
    const tenantId = environment.tenantId;

    // Fetch source channels first, then inquiries
    this.sourceChannelsService.list(tenantId).subscribe({
      next: (channels) => {
        this.sourceChannels = channels;
        this.loadInquiries();
      },
      error: (err) => {
        console.error('Failed to load source channels:', err);
        // Continue loading inquiries even if channels fail
        this.loadInquiries();
      }
    });
  }

  private loadInquiries() {
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
    return this.statusBadge[status] || 'bg-gray-100 text-gray-700';
  }

  getSourceClass(sourceIdOrName: string): string {
    const channel = this.sourceChannels.find(c => c.id === sourceIdOrName || c.name === sourceIdOrName);
    const s = (channel ? channel.name : sourceIdOrName || '').toLowerCase();
    
    if (s.includes('whatsapp')) return 'bg-[#DCF8C6] text-[#128C7E]';
    if (s.includes('email')) return 'bg-blue-50 text-blue-700';
    if (s.includes('phone')) return 'bg-orange-50 text-orange-700';
    if (s.includes('walk')) return 'bg-purple-50 text-purple-700';
    return 'bg-gray-100 text-gray-600';
  }

  getChannelName(sourceChannelId: string): string {
    const channel = this.sourceChannels.find(c => c.id === sourceChannelId);
    return channel ? channel.name : (sourceChannelId || 'Unknown');
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}