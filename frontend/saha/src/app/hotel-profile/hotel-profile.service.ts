import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { HotelProfile, UpdateHotelProfileRequest } from './hotel-profile.model';

@Injectable({ providedIn: 'root' })
export class HotelProfileService {
  private http = inject(HttpClient);

  private profileUrl(tenantId: string): string {
    return `${environment.apiBaseUrl}/api/tenants/${tenantId}/profile`;
  }

  getProfile(tenantId: string): Observable<HotelProfile> {
    return this.http.get<HotelProfile>(this.profileUrl(tenantId));
  }

  updateProfile(tenantId: string, body: UpdateHotelProfileRequest): Observable<HotelProfile> {
    return this.http.put<HotelProfile>(this.profileUrl(tenantId), body);
  }
}
