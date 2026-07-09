import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { QuoteSettings, QuoteSettingsUpsertRequest } from './quote-settings.model';

@Injectable({ providedIn: 'root' })
export class QuoteSettingsService {
  private http = inject(HttpClient);

  private base(tenantId: string): string {
    return `${environment.apiBaseUrl}/api/tenants/${tenantId}/quote-settings`;
  }

  get(tenantId: string): Observable<QuoteSettings> {
    return this.http.get<QuoteSettings>(this.base(tenantId));
  }

  save(tenantId: string, body: QuoteSettingsUpsertRequest): Observable<QuoteSettings> {
    return this.http.put<QuoteSettings>(this.base(tenantId), body);
  }
}
