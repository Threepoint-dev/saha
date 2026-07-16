import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InquiryService, Inquiry } from '../../../core/services/inquiry.service';

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './pipeline.html',
  styleUrl: './pipeline.scss'
})
export class PipelineComponent implements OnInit {
  inquiries: Inquiry[] = [];
  isLoading = true;
  viewMode: 'board' | 'list' = 'board';
  searchQuery = '';

  statuses = ['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST'];

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isLoading = true;
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

  get filtered(): Inquiry[] {
    return this.inquiries.filter(i => {
      return !this.searchQuery ||
        i.clientName.toLowerCase().includes(this.searchQuery.toLowerCase());
    });
  }

  getByStatus(status: string): Inquiry[] {
    return this.filtered.filter(i => i.status === status);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}