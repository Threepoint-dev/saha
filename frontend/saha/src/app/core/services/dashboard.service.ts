import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface DashboardStats {
  total: number;
  new: number;
  contacted: number;
  quoted: number;
  won: number;
  lost: number;
}

export interface RecentInquiry {
  id: string;
  inquiryNumber: string;
  clientName: string;
  eventType: string;
  status: string;
  sourceChannelId: string;
  createdAt: string;
  estimatedValue: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private api = environment.apiBaseUrl;
  private tenantId = environment.tenantId;

  constructor(private http: HttpClient) {}

  getInquiries(): Observable<RecentInquiry[]> {
    return this.http.get<RecentInquiry[]>(
      `${this.api}/api/inquiries/tenant/${this.tenantId}`
    );
  }
}