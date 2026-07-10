import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CatalogItem,
  InquirySummary,
  LineItemRequest,
  PublicQuote,
  Quote,
  QuoteLineItem,
  ShareLinkResponse,
  UpdateQuoteRequest
} from './quotes.model';

interface HallDto { id: string; name: string; basePrice: number | null; }
interface PackageDto { id: string; name: string; price: number | null; isTaxable: boolean | null; }
interface AddonDto { id: string; name: string; price: number | null; isTaxable: boolean | null; }

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private http = inject(HttpClient);

  private readonly api = `${environment.apiBaseUrl}/api`;

  private tenantBase(tenantId: string): string {
    return `${this.api}/tenants/${tenantId}`;
  }

  // --- Inquiry ---
  getInquiry(tenantId: string, inquiryId: string): Observable<InquirySummary> {
    return this.http.get<InquirySummary>(`${this.tenantBase(tenantId)}/inquiries/${inquiryId}`);
  }

  // --- Quotes ---
  listQuotes(tenantId: string, inquiryId: string): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.tenantBase(tenantId)}/inquiries/${inquiryId}/quotes`);
  }

  createQuote(tenantId: string, inquiryId: string, notes: string | null = null): Observable<Quote> {
    return this.http.post<Quote>(`${this.tenantBase(tenantId)}/inquiries/${inquiryId}/quotes`, { notes });
  }

  getQuote(tenantId: string, inquiryId: string, quoteId: string): Observable<Quote> {
    return this.http.get<Quote>(`${this.tenantBase(tenantId)}/inquiries/${inquiryId}/quotes/${quoteId}`);
  }

  updateQuote(tenantId: string, inquiryId: string, quoteId: string, body: UpdateQuoteRequest): Observable<Quote> {
    return this.http.put<Quote>(`${this.tenantBase(tenantId)}/inquiries/${inquiryId}/quotes/${quoteId}`, body);
  }

  cancelQuote(tenantId: string, inquiryId: string, quoteId: string): Observable<void> {
    return this.http.delete<void>(`${this.tenantBase(tenantId)}/inquiries/${inquiryId}/quotes/${quoteId}`);
  }

  duplicateQuote(tenantId: string, inquiryId: string, quoteId: string): Observable<Quote> {
    return this.http.post<Quote>(`${this.tenantBase(tenantId)}/inquiries/${inquiryId}/quotes/${quoteId}/duplicate`, {});
  }

  // --- Line items ---
  private lineItemsBase(tenantId: string, quoteId: string): string {
    return `${this.tenantBase(tenantId)}/quotes/${quoteId}/line-items`;
  }

  listLineItems(tenantId: string, quoteId: string): Observable<QuoteLineItem[]> {
    return this.http.get<QuoteLineItem[]>(this.lineItemsBase(tenantId, quoteId));
  }

  addLineItem(tenantId: string, quoteId: string, body: LineItemRequest): Observable<QuoteLineItem> {
    return this.http.post<QuoteLineItem>(this.lineItemsBase(tenantId, quoteId), body);
  }

  updateLineItem(tenantId: string, quoteId: string, itemId: string, body: LineItemRequest): Observable<QuoteLineItem> {
    return this.http.put<QuoteLineItem>(`${this.lineItemsBase(tenantId, quoteId)}/${itemId}`, body);
  }

  deleteLineItem(tenantId: string, quoteId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.lineItemsBase(tenantId, quoteId)}/${itemId}`);
  }

  reorderLineItems(tenantId: string, quoteId: string, orderedIds: string[]): Observable<QuoteLineItem[]> {
    return this.http.put<QuoteLineItem[]>(`${this.lineItemsBase(tenantId, quoteId)}/reorder`, { orderedIds });
  }

  // --- Sharing ---
  share(tenantId: string, quoteId: string): Observable<ShareLinkResponse> {
    return this.http.post<ShareLinkResponse>(`${this.tenantBase(tenantId)}/quotes/${quoteId}/share`, {});
  }

  getPublicQuote(shareToken: string): Observable<PublicQuote> {
    return this.http.get<PublicQuote>(`${this.api}/public/quotes/${shareToken}`);
  }

  // --- Catalog (active halls / packages / add-ons for the picker) ---
  loadCatalog(tenantId: string): Observable<CatalogItem[]> {
    return forkJoin({
      halls: this.http.get<HallDto[]>(`${this.tenantBase(tenantId)}/halls`),
      packages: this.http.get<PackageDto[]>(`${this.tenantBase(tenantId)}/packages`),
      addons: this.http.get<AddonDto[]>(`${this.tenantBase(tenantId)}/addons`)
    }).pipe(
      map(({ halls, packages, addons }) => [
        ...halls.map((h): CatalogItem => ({ id: h.id, name: h.name, price: h.basePrice, isTaxable: true, type: 'hall' })),
        ...packages.map((p): CatalogItem => ({ id: p.id, name: p.name, price: p.price, isTaxable: p.isTaxable ?? true, type: 'package' })),
        ...addons.map((a): CatalogItem => ({ id: a.id, name: a.name, price: a.price, isTaxable: a.isTaxable ?? true, type: 'addon' }))
      ])
    );
  }
}
