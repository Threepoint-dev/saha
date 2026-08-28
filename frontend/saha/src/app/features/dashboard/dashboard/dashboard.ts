import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DashboardService, RecentInquiry } from '../../../core/services/dashboard.service';
import { SourceChannelsService } from '../../setup/source-channels.service';
import { SourceChannel } from '../../setup/source-channels.model';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private translateService = inject(TranslateService);

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

  /** Locale follows the active app language, so the month name shows in Arabic when Arabic is selected. */
  private get locale(): string {
    return this.translateService.currentLang() === 'ar' ? 'ar-SA' : 'en-US';
  }

  get currentMonth(): string {
    return new Date().toLocaleDateString(this.locale, { month: 'long', year: 'numeric' });
  }

  // Real first response time calculation
  get firstResponseMinutes(): number {
    const responded = this.inquiries.filter(i =>
      i.firstResponseAt && i.createdAt
    );
    if (responded.length === 0) return 0;

    const minutes = responded.map(i => {
      const created = new Date(i.createdAt).getTime();
      const responded = new Date(i.firstResponseAt).getTime();
      return Math.floor((responded - created) / 60000);
    });

    minutes.sort((a, b) => a - b);
    const mid = Math.floor(minutes.length / 2);
    return minutes.length % 2 === 0
      ? Math.floor((minutes[mid - 1] + minutes[mid]) / 2)
      : minutes[mid];
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
      let key = inq.sourceChannelId || 'Unknown';
      const channel = this.sourceChannels.find(c => c.id === key);
      if (channel) key = channel.name;
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

  // Real loss reasons from actual inquiry data
  get lossReasonSummary(): { label: string; count: number; pct: number }[] {
    const lostInquiries = this.inquiries.filter(i => i.status === 'LOST' && i.lossReason);
    if (lostInquiries.length === 0) return [];

    const reasonMap: Record<string, number> = {};
    for (const inq of lostInquiries) {
      const reason = inq.lossReason || 'Other';
      reasonMap[reason] = (reasonMap[reason] || 0) + 1;
    }

    const total = lostInquiries.length;
    return Object.entries(reasonMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        label,
        count,
        pct: Math.round((count / total) * 100)
      }));
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
    const tenantId = this.authService.getTenantId();

    this.sourceChannelsService.list(tenantId).subscribe({
      next: (channels) => {
        this.sourceChannels = channels;
        this.loadInquiries();
      },
      error: () => {
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

  /** Translation key for a status badge/stat card, e.g. 'NEW' -> 'dashboard.stat.new'. */
  statusLabelKey(status: string): string {
    return `dashboard.stat.${(status || 'new').toLowerCase()}`;
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
    return date.toLocaleDateString(this.locale, { month: 'short', day: 'numeric' });
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(this.locale, { month: 'short', day: 'numeric' });
  }
}