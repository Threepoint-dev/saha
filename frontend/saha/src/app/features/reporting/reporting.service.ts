import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DateRange, ReportingSummary } from './reporting.model';

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private http = inject(HttpClient);

  getSummary(tenantId: string, range?: DateRange): Observable<ReportingSummary> {
    let params = new HttpParams();
    if (range?.from) {
      params = params.set('from', range.from);
    }
    if (range?.to) {
      params = params.set('to', range.to);
    }
    return this.http.get<ReportingSummary>(
      `${environment.apiBaseUrl}/api/tenants/${tenantId}/reports/summary`,
      { params }
    );
  }
}
