import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { HallAvailabilityBlock, HallAvailabilityConflict, HallAvailabilityUpsertRequest } from './availability.model';

/** Thrown by create/update when the API responds 409 with a conflicting block. */
export class HallAvailabilityConflictError extends Error {
  constructor(public conflict: HallAvailabilityConflict) {
    super(conflict.message);
  }
}

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private http = inject(HttpClient);

  private base(tenantId: string): string {
    return `${environment.apiBaseUrl}/api/tenants/${tenantId}/hall-availability`;
  }

  list(tenantId: string, from: string, to: string, hallId?: string | null): Observable<HallAvailabilityBlock[]> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (hallId) {
      params = params.set('hallId', hallId);
    }
    return this.http.get<HallAvailabilityBlock[]>(this.base(tenantId), { params });
  }

  create(tenantId: string, createdBy: string | null, body: HallAvailabilityUpsertRequest): Observable<HallAvailabilityBlock> {
    let params = new HttpParams();
    if (createdBy) {
      params = params.set('createdBy', createdBy);
    }
    return this.http.post<HallAvailabilityBlock>(this.base(tenantId), body, { params }).pipe(
      catchError((err) => this.rethrowConflict(err))
    );
  }

  update(tenantId: string, id: string, body: HallAvailabilityUpsertRequest): Observable<HallAvailabilityBlock> {
    return this.http.put<HallAvailabilityBlock>(`${this.base(tenantId)}/${id}`, body).pipe(
      catchError((err) => this.rethrowConflict(err))
    );
  }

  delete(tenantId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base(tenantId)}/${id}`);
  }

  private rethrowConflict(err: HttpErrorResponse) {
    if (err.status === 409 && err.error?.conflict) {
      return throwError(() => new HallAvailabilityConflictError(err.error as HallAvailabilityConflict));
    }
    return throwError(() => err);
  }
}