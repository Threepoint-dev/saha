import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LostReasonAnalysis, ReportingFilter, ReportingSummary, ResponseTimeAnalysis } from './reporting.model';

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private http = inject(HttpClient);

  getSummary(tenantId: string, filter?: ReportingFilter): Observable<ReportingSummary> {
    let params = new HttpParams();
    if (filter?.from) {
      params = params.set('from', filter.from);
    }
    if (filter?.to) {
      params = params.set('to', filter.to);
    }
    if (filter?.channelId) {
      params = params.set('channelId', filter.channelId);
    }
    if (filter?.ownerId) {
      params = params.set('ownerId', filter.ownerId);
    }
    if (filter?.eventType) {
      params = params.set('eventType', filter.eventType);
    }
    if (filter?.status) {
      params = params.set('status', filter.status);
    }
    return this.http.get<ReportingSummary>(
      `${environment.apiBaseUrl}/api/tenants/${tenantId}/reports/summary`,
      { params }
    );
  }

  getLostReasonAnalysis(tenantId: string, from?: string, to?: string): Observable<LostReasonAnalysis> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<LostReasonAnalysis>(
      `${environment.apiBaseUrl}/api/tenants/${tenantId}/reports/lost-reasons`,
      { params }
    );
  }

  getResponseTimeAnalysis(tenantId: string, from?: string, to?: string): Observable<ResponseTimeAnalysis> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ResponseTimeAnalysis>(
      `${environment.apiBaseUrl}/api/tenants/${tenantId}/reports/response-time`,
      { params }
    );
  }
}