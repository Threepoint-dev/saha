import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Addon,
  AddonUpsertRequest,
  EventPackage,
  Hall,
  HallUpsertRequest,
  PackageUpsertRequest
} from './reference-data.model';

@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private http = inject(HttpClient);

  private base(tenantId: string, resource: 'halls' | 'packages' | 'addons'): string {
    return `${environment.apiBaseUrl}/api/tenants/${tenantId}/${resource}`;
  }

  // Halls
  listHalls(tenantId: string): Observable<Hall[]> {
    return this.http.get<Hall[]>(this.base(tenantId, 'halls'));
  }
  createHall(tenantId: string, body: HallUpsertRequest): Observable<Hall> {
    return this.http.post<Hall>(this.base(tenantId, 'halls'), body);
  }
  updateHall(tenantId: string, id: string, body: HallUpsertRequest): Observable<Hall> {
    return this.http.put<Hall>(`${this.base(tenantId, 'halls')}/${id}`, body);
  }
  archiveHall(tenantId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base(tenantId, 'halls')}/${id}`);
  }

  // Packages
  listPackages(tenantId: string): Observable<EventPackage[]> {
    return this.http.get<EventPackage[]>(this.base(tenantId, 'packages'));
  }
  createPackage(tenantId: string, body: PackageUpsertRequest): Observable<EventPackage> {
    return this.http.post<EventPackage>(this.base(tenantId, 'packages'), body);
  }
  updatePackage(tenantId: string, id: string, body: PackageUpsertRequest): Observable<EventPackage> {
    return this.http.put<EventPackage>(`${this.base(tenantId, 'packages')}/${id}`, body);
  }
  archivePackage(tenantId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base(tenantId, 'packages')}/${id}`);
  }

  // Addons
  listAddons(tenantId: string): Observable<Addon[]> {
    return this.http.get<Addon[]>(this.base(tenantId, 'addons'));
  }
  createAddon(tenantId: string, body: AddonUpsertRequest): Observable<Addon> {
    return this.http.post<Addon>(this.base(tenantId, 'addons'), body);
  }
  updateAddon(tenantId: string, id: string, body: AddonUpsertRequest): Observable<Addon> {
    return this.http.put<Addon>(`${this.base(tenantId, 'addons')}/${id}`, body);
  }
  archiveAddon(tenantId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base(tenantId, 'addons')}/${id}`);
  }
}
