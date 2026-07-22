import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InquiryService, Inquiry } from '../../../core/services/inquiry.service';
import { SourceChannelsService } from '../../setup/source-channels.service';
import { SourceChannel } from '../../setup/source-channels.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './pipeline.html',
  styleUrl: './pipeline.scss'
})
export class PipelineComponent implements OnInit {
  inquiries: Inquiry[] = [];
  sourceChannels: SourceChannel[] = [];
  isLoading = true;
  viewMode: 'board' | 'list' = 'board';
  searchQuery = '';
  filterStatus = '';
  filterSource = '';

  statuses = ['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST'];

  statusDotColors: Record<string, string> = {
    NEW: 'bg-[#4B9ED6]',
    CONTACTED: 'bg-[#E0922F]',
    QUOTED: 'bg-[#E05A5A]',
    WON: 'bg-[#2E7D5B]',
    LOST: 'bg-[#D14343]',
  };

  statusColors: Record<string, string> = {
    NEW: 'bg-blue-500',
    CONTACTED: 'bg-yellow-500',
    QUOTED: 'bg-purple-500',
    WON: 'bg-green-500',
    LOST: 'bg-red-500',
  };

  statusBadge: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    CONTACTED: 'bg-yellow-100 text-yellow-700',
    QUOTED: 'bg-purple-100 text-purple-700',
    WON: 'bg-green-100 text-green-700',
    LOST: 'bg-red-100 text-red-700',
  };

  constructor(
    private inquiryService: InquiryService,
    private sourceChannelsService: SourceChannelsService,
    private cdr: ChangeDetectorRef
  ) {}

  draggedInquiry: Inquiry | null = null;

  onDragStart(event: DragEvent, inquiry: Inquiry) {
    this.draggedInquiry = inquiry;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow dropping
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, status: string) {
    event.preventDefault();
    if (this.draggedInquiry && this.draggedInquiry.status !== status) {
      const inquiryToUpdate = this.draggedInquiry;
      if (!inquiryToUpdate.id) return;
      const originalStatus = inquiryToUpdate.status;
      
      // Optimistic update
      inquiryToUpdate.status = status;
      this.cdr.detectChanges();
      
      this.inquiryService.updateStatus(inquiryToUpdate.id, status).subscribe({
        error: (err) => {
          console.error('Failed to update status', err);
          // Revert on failure
          inquiryToUpdate.status = originalStatus;
          this.cdr.detectChanges();
        }
      });
    }
    this.draggedInquiry = null;
  }

  ngOnInit() {
    this.isLoading = true;
    const tenantId = environment.tenantId;

    this.sourceChannelsService.list(tenantId).subscribe({
      next: (channels) => {
        this.sourceChannels = channels;
        this.loadInquiries();
      },
      error: (err) => {
        console.error('Failed to load source channels:', err);
        this.loadInquiries();
      }
    });
  }

  private loadInquiries() {
    this.inquiryService.getAll().subscribe({
      next: (data) => {
        this.inquiries = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Pipeline error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getChannelName(sourceChannelId: string | undefined): string {
    if (!sourceChannelId) return '—';
    const channel = this.sourceChannels.find(c => c.id === sourceChannelId);
    return channel ? channel.name : sourceChannelId;
  }

  get filtered(): Inquiry[] {
    return this.inquiries.filter(i => {
      const matchesSearch = !this.searchQuery || i.clientName.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesStatus = !this.filterStatus || i.status === this.filterStatus;
      const matchesSource = !this.filterSource || i.sourceChannelId === this.filterSource;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }

  getByStatus(status: string): Inquiry[] {
    return this.filtered.filter(i => i.status === status);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatDate(date: string): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  formatRelativeTime(date: string): string {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + 'm';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h';
    return Math.floor(hours / 24) + 'd';
  }
}