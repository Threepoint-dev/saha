import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DataQualityReport, ExportType } from './export.model';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private http = inject(HttpClient);

  /** Fetches a CSV extract as a Blob so the caller can trigger a browser download. */
  downloadCsv(tenantId: string, type: ExportType): Observable<Blob> {
    return this.http.get(
      `${environment.apiBaseUrl}/api/tenants/${tenantId}/export/${type}`,
      { responseType: 'blob' }
    );
  }

  getDataQuality(tenantId: string): Observable<DataQualityReport> {
    return this.http.get<DataQualityReport>(
      `${environment.apiBaseUrl}/api/tenants/${tenantId}/data-quality`
    );
  }
}
