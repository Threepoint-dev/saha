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

export interface Hall {
  id: string;
  name: string;
  capacity: number | null;
  basePrice: number | null;
  defaultSetup: string | null;
  status: string | null;
}

export interface Addon {
  id: string;
  name: string;
  price: number | null;
  isTaxable: boolean | null;
  status: string | null;
}

export interface EventSetup {
  id: string;
  inquiryId: string;
  quoteId: string | null;
  hallId: string | null;
  setupType: string | null;
  layoutNotes: string | null;
  guestCount: number | null;
  banquetHeadcount: number | null;
  cateringStyle: string | null;
  mainMeal: string | null;
  startTime: string | null;
  endTime: string | null;
  durationHours: number | null;
  eventDate: string | null;
  chairColor: string | null;
  tableColor: string | null;
  agenda: string | null;
  internalNotes: string | null;
  opsNotes: string | null;
  attachmentUrl: string | null;
  preparationStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EventSetupRequest {
  quoteId: string | null;
  hallId: string | null;
  setupType: string | null;
  layoutNotes: string | null;
  guestCount: number | null;
  banquetHeadcount: number | null;
  cateringStyle: string | null;
  mainMeal: string | null;
  startTime: string | null;
  endTime: string | null;
  durationHours: number | null;
  eventDate: string | null;
  chairColor: string | null;
  tableColor: string | null;
  agenda: string | null;
  internalNotes: string | null;
  opsNotes: string | null;
  attachmentUrl: string | null;
  preparationStatus: string | null;
}

export interface EventAddon {
  id: string;
  eventSetupId: string;
  addonId: string;
  quantity: number | null;
  addonName: string | null;
  unitPrice: number | null;
  isTaxable: boolean | null;
  lineTotal: number | null;
}

export interface EventAddonRequest {
  addonId: string;
  quantity: number;
}

export interface EventSummary {
  hotel: {
    name: string | null;
    logoUrl: string | null;
    city: string | null;
    district: string | null;
    phone: string | null;
  } | null;
  clientName: string | null;
  eventDate: string | null;
  hallName: string | null;
  setupType: string | null;
  guestCount: number | null;
  cateringStyle: string | null;
  mainMeal: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string | null;
  confirmed: boolean;
  addons: { name: string | null; quantity: number | null }[];
  quoteTotal: number | null;
}

export const SETUP_TYPES = ['Banquet', 'Theater', 'Classroom', 'U-Shape', 'Cocktail', 'Custom'];
export const CATERING_STYLES = ['Full Service', 'Buffet', 'Stations', 'None'];
