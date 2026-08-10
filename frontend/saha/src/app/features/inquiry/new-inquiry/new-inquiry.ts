import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InquiryService } from '../../../core/services/inquiry.service';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-new-inquiry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './new-inquiry.html',
  styleUrl: './new-inquiry.scss'
})
export class NewInquiryComponent implements OnInit {
  isLoading = false;
  isSubmitted = false;
  errorFields: string[] = [];
  createdInquiryNumber = '';

  sourceChannels: any[] = [];
  halls: any[] = [];
  users: any[] = [];

  form = {
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    sourceChannelId: '',
    eventType: '',
    eventDate: '',
    guestCount: null as number | null,
    hallId: '',
    estimatedValue: null as number | null,
    ownerId: '',
    notes: ''
  };

  eventTypes = [
    'Wedding', 'Conference', 'Graduation', 'Corporate Gala',
    'Birthday', 'Meeting', 'Exhibition', 'Other'
  ];

  constructor(
    private inquiryService: InquiryService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const tenantId = this.authService.currentUser()?.tenantId || environment.tenantId;
    const api = environment.apiBaseUrl;

    this.http.get<any[]>(`${api}/api/tenants/${tenantId}/source-channels`)
      .subscribe({ next: (data) => { this.sourceChannels = data; this.cdr.detectChanges(); }, error: () => {} });

    this.http.get<any[]>(`${api}/api/tenants/${tenantId}/halls`)
      .subscribe({ next: (data) => { this.halls = data; this.cdr.detectChanges(); }, error: () => {} });

    this.http.get<any[]>(`${api}/api/users/tenant/${tenantId}`)
      .subscribe({ next: (data) => { this.users = data; this.cdr.detectChanges(); }, error: () => {} });
  }

  validate(): boolean {
    this.errorFields = [];
    if (!this.form.clientName) this.errorFields.push('clientName');
    if (!this.form.clientPhone) this.errorFields.push('clientPhone');
    if (!this.form.eventType) this.errorFields.push('eventType');
    if (!this.form.eventDate) this.errorFields.push('eventDate');
    if (!this.form.guestCount) this.errorFields.push('guestCount');
    if (!this.form.sourceChannelId) this.errorFields.push('sourceChannelId');
    return this.errorFields.length === 0;
  }

  hasError(field: string): boolean {
    return this.errorFields.includes(field);
  }

  async submit() {
    if (!this.validate()) return;
    this.isLoading = true;
    this.inquiryService.create({
      clientName: this.form.clientName,
      clientPhone: this.form.clientPhone,
      clientEmail: this.form.clientEmail,
      sourceChannelId: this.form.sourceChannelId || undefined,
      hallId: this.form.hallId || undefined,
      ownerId: this.form.ownerId || undefined,
      eventType: this.form.eventType,
      eventDate: this.form.eventDate || undefined,
      guestCount: this.form.guestCount!,
      estimatedValue: this.form.estimatedValue || undefined,
      notes: this.form.notes || undefined,
    }).subscribe({
      next: (inquiry) => {
        this.isLoading = false;
        this.router.navigate(['/inquiries', inquiry.id]);
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel() {
    this.router.navigate(['/inquiries']);
  }
}