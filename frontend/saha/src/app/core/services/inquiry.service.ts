import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Inquiry {
  id?: string;
  tenantId?: string;
  ownerId?: string;
  sourceChannelId?: string;
  hallId?: string;
  inquiryNumber?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone: string;
  eventType: string;
  eventDate?: string;
  guestCount: number;
  estimatedValue?: number;
  priority?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InquiryService {
  private api = environment.apiBaseUrl;
  private tenantId = environment.tenantId;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Inquiry[]> {
    return this.http.get<Inquiry[]>(
      `${this.api}/api/inquiries/tenant/${this.tenantId}`
    );
  }

  getById(id: string): Observable<Inquiry> {
    return this.http.get<Inquiry>(`${this.api}/api/inquiries/${id}`);
  }

  create(inquiry: Inquiry): Observable<Inquiry> {
    return this.http.post<Inquiry>(`${this.api}/api/inquiries`, {
      ...inquiry,
      tenantId: this.tenantId
    });
  }

  update(id: string, inquiry: Inquiry): Observable<Inquiry> {
    return this.http.put<Inquiry>(`${this.api}/api/inquiries/${id}`, inquiry);
  }

  updateStatus(id: string, status: string): Observable<Inquiry> {
    return this.http.patch<Inquiry>(
      `${this.api}/api/inquiries/${id}/status`,
      { status }
    );
  }

  markLost(id: string, lossReason: string, lossNote: string): Observable<Inquiry> {
    return this.http.patch<Inquiry>(
      `${this.api}/api/inquiries/${id}/mark-lost`,
      { lossReason, lossNote }
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/api/inquiries/${id}`);
  }
}