import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Addon,
  EventAddon,
  EventAddonRequest,
  EventSetup,
  EventSetupRequest,
  EventsDirectorDashboard,
  EventsTeamRequest,
  EventsTeamRequestDetail,
  EventSummary,
  Hall,
  InquirySummary,
  PreparationStatusUpdateRequest
} from './events.model';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private http = inject(HttpClient);

  private readonly api = `${environment.apiBaseUrl}/api`;

  private tenantBase(tenantId: string): string {
    return `${this.api}/tenants/${tenantId}`;
  }

  // --- Inquiry ---
  getInquiry(tenantId: string, inquiryId: string): Observable<InquirySummary> {
    return this.http.get<InquirySummary>(`${this.tenantBase(tenantId)}/inquiries/${inquiryId}`);
  }

  // --- Reference data (active halls / add-ons) ---
  listHalls(tenantId: string): Observable<Hall[]> {
    return this.http.get<Hall[]>(`${this.tenantBase(tenantId)}/halls`);
  }

  listAddons(tenantId: string): Observable<Addon[]> {
    return this.http.get<Addon[]>(`${this.tenantBase(tenantId)}/addons`);
  }

  // --- Event setup ---
  private setupBase(tenantId: string, inquiryId: string): string {
    return `${this.tenantBase(tenantId)}/inquiries/${inquiryId}/event-setup`;
  }

  getEventSetup(tenantId: string, inquiryId: string): Observable<EventSetup> {
    return this.http.get<EventSetup>(this.setupBase(tenantId, inquiryId));
  }

  createEventSetup(tenantId: string, inquiryId: string, body: EventSetupRequest): Observable<EventSetup> {
    return this.http.post<EventSetup>(this.setupBase(tenantId, inquiryId), body);
  }

  updateEventSetup(tenantId: string, inquiryId: string, body: EventSetupRequest): Observable<EventSetup> {
    return this.http.put<EventSetup>(this.setupBase(tenantId, inquiryId), body);
  }

  deleteEventSetup(tenantId: string, inquiryId: string): Observable<void> {
    return this.http.delete<void>(this.setupBase(tenantId, inquiryId));
  }

  // --- Event add-ons ---
  private addonsBase(tenantId: string, eventSetupId: string): string {
    return `${this.tenantBase(tenantId)}/event-setups/${eventSetupId}/addons`;
  }

  listEventAddons(tenantId: string, eventSetupId: string): Observable<EventAddon[]> {
    return this.http.get<EventAddon[]>(this.addonsBase(tenantId, eventSetupId));
  }

  addEventAddon(tenantId: string, eventSetupId: string, body: EventAddonRequest): Observable<EventAddon> {
    return this.http.post<EventAddon>(this.addonsBase(tenantId, eventSetupId), body);
  }

  updateEventAddonQuantity(tenantId: string, eventSetupId: string, eventAddonId: string, quantity: number): Observable<EventAddon> {
    return this.http.put<EventAddon>(`${this.addonsBase(tenantId, eventSetupId)}/${eventAddonId}`, { quantity });
  }

  removeEventAddon(tenantId: string, eventSetupId: string, eventAddonId: string): Observable<void> {
    return this.http.delete<void>(`${this.addonsBase(tenantId, eventSetupId)}/${eventAddonId}`);
  }

  // --- Customer confirmation / summary ---
  confirm(tenantId: string, inquiryId: string): Observable<EventSummary> {
    return this.http.post<EventSummary>(`${this.tenantBase(tenantId)}/inquiries/${inquiryId}/confirm`, {});
  }

  getPublicSummary(inquiryId: string): Observable<EventSummary> {
    return this.http.get<EventSummary>(`${this.api}/public/events/${inquiryId}/summary`);
  }

  // --- Events Team Request Tracker & Detail (EP-08) ---
  private teamRequestsBase(tenantId: string): string {
    return `${this.tenantBase(tenantId)}/events-team/requests`;
  }

  listTeamRequests(tenantId: string): Observable<EventsTeamRequest[]> {
    return this.http.get<EventsTeamRequest[]>(this.teamRequestsBase(tenantId));
  }

  getTeamRequestDetail(tenantId: string, inquiryId: string): Observable<EventsTeamRequestDetail> {
    return this.http.get<EventsTeamRequestDetail>(`${this.teamRequestsBase(tenantId)}/${inquiryId}`);
  }

  updatePreparationStatus(tenantId: string, inquiryId: string, body: PreparationStatusUpdateRequest): Observable<EventsTeamRequest> {
    return this.http.patch<EventsTeamRequest>(`${this.teamRequestsBase(tenantId)}/${inquiryId}/status`, body);
  }

  // --- Events Director Dashboard (EP-08) ---
  getDirectorDashboard(tenantId: string): Observable<EventsDirectorDashboard> {
    return this.http.get<EventsDirectorDashboard>(`${this.tenantBase(tenantId)}/events-team/dashboard`);
  }
}