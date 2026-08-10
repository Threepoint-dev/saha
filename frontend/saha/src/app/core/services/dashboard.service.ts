import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface RecentInquiry {
  id: string;
  inquiryNumber: string;
  clientName: string;
  eventType: string;
  status: string;
  sourceChannelId: string;
  createdAt: string;
  estimatedValue: number;
  firstResponseAt: string;
  lossReason: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private api = environment.apiBaseUrl;
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {}

  private get tenantId(): string {
    return this.authService.currentUser()?.tenantId || environment.tenantId;
  }

  getInquiries(): Observable<RecentInquiry[]> {
    return this.http.get<RecentInquiry[]>(
      `${this.api}/api/inquiries/tenant/${this.tenantId}`
    );
  }
}