export interface QuoteSettings {
  id: string;
  tenantId: string;
  vatRate: number | null;
  validityDays: number | null;
  quotePrefix: string | null;
  defaultTerms: string | null;
  footerText: string | null;
  enablePdfBranding: boolean | null;
  allowManualDiscount: boolean | null;
  updatedAt: string | null;
}

export interface QuoteSettingsUpsertRequest {
  vatRate: number | null;
  validityDays: number | null;
  quotePrefix: string | null;
  defaultTerms: string | null;
  footerText: string | null;
  enablePdfBranding: boolean | null;
  allowManualDiscount: boolean | null;
}
