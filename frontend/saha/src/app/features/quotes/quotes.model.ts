export interface InquirySummary {
  id: string;
  tenantId: string;
  clientName: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  eventDate: string | null;
  guestCount: number | null;
  status: string | null;
}

export interface QuoteLineItem {
  id: string;
  quoteId: string;
  itemName: string;
  itemType: string | null;
  description: string | null;
  quantity: number | null;
  unitPrice: number | null;
  isTaxable: boolean | null;
  total: number | null;
  sortOrder: number | null;
}

export interface Quote {
  id: string;
  tenantId: string;
  inquiryId: string;
  createdBy: string | null;
  quoteNumber: string | null;
  status: string | null;
  subtotal: number | null;
  vatAmount: number | null;
  vatRate: number | null;
  total: number | null;
  issuedDate: string | null;
  validUntil: string | null;
  notes: string | null;
  shareLink: string | null;
  isCurrent: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  lineItems?: QuoteLineItem[] | null;
}

export interface LineItemRequest {
  itemName: string;
  itemType: string | null;
  description: string | null;
  quantity: number | null;
  unitPrice: number | null;
  isTaxable: boolean | null;
  sortOrder?: number | null;
  sourceId?: string | null;
}

export interface UpdateQuoteRequest {
  notes: string | null;
  status: string | null;
}

export interface ShareLinkResponse {
  shareToken: string;
  shareUrl: string;
}

export type CatalogType = 'hall' | 'package' | 'addon';

export interface CatalogItem {
  id: string;
  name: string;
  price: number | null;
  isTaxable: boolean;
  type: CatalogType;
}

export interface PublicHotel {
  name: string | null;
  logoUrl: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  quoteFooterText: string | null;
  termsNotes: string | null;
}

export interface PublicClient {
  clientName: string | null;
  eventDate: string | null;
  guestCount: number | null;
}

export interface PublicQuote {
  quoteNumber: string | null;
  status: string | null;
  subtotal: number | null;
  vatAmount: number | null;
  vatRate: number | null;
  total: number | null;
  issuedDate: string | null;
  validUntil: string | null;
  notes: string | null;
  lineItems: QuoteLineItem[];
  hotel: PublicHotel | null;
  client: PublicClient | null;
}
