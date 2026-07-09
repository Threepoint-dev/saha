export interface HotelProfile {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  mainContactName: string | null;
  mainContactEmail: string | null;
  mainContactPhone: string | null;
  logoUrl: string | null;
  quoteFooterText: string | null;
  termsNotes: string | null;
  isActive: boolean | null;
  readinessStatus: string | null;
  pilotStatus: string | null;
  pilotStartDate: string | null;
  baselineDuration: number | null;
  dataQualityScore: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateHotelProfileRequest {
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  mainContactName: string | null;
  mainContactEmail: string | null;
  mainContactPhone: string | null;
  logoUrl: string | null;
  quoteFooterText: string | null;
  termsNotes: string | null;
  isActive: boolean | null;
}
