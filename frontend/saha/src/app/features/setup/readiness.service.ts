import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Readiness } from './readiness.model';

@Injectable({ providedIn: 'root' })
export class ReadinessService {
  private http = inject(HttpClient);

  get(tenantId: string): Observable<Readiness> {
    return this.http.get<Readiness>(`${environment.apiBaseUrl}/api/tenants/${tenantId}/readiness`);
  }
}
