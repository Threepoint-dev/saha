import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SourceChannel, SourceChannelUpsertRequest } from './source-channels.model';

@Injectable({ providedIn: 'root' })
export class SourceChannelsService {
  private http = inject(HttpClient);

  private base(tenantId: string): string {
    return `${environment.apiBaseUrl}/api/tenants/${tenantId}/source-channels`;
  }

  list(tenantId: string): Observable<SourceChannel[]> {
    return this.http.get<SourceChannel[]>(this.base(tenantId));
  }

  create(tenantId: string, body: SourceChannelUpsertRequest): Observable<SourceChannel> {
    return this.http.post<SourceChannel>(this.base(tenantId), body);
  }

  update(tenantId: string, id: string, body: SourceChannelUpsertRequest): Observable<SourceChannel> {
    return this.http.put<SourceChannel>(`${this.base(tenantId)}/${id}`, body);
  }

  delete(tenantId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base(tenantId)}/${id}`);
  }
}
