export interface StatusCount {
  status: string;
  count: number;
}

export interface SourceCount {
  sourceName: string;
  count: number;
}

export interface MonthCount {
  month: string;
  count: number;
}

export interface MonthValue {
  month: string;
  value: number;
}

export interface ReportingSummary {
  totalInquiries: number;
  newInquiries: number;
  wonInquiries: number;
  lostInquiries: number;
  conversionRate: number;
  totalQuoteValue: number;
  avgResponseTimeHours: number;
  inquiriesByStatus: StatusCount[];
  inquiriesBySource: SourceCount[];
  inquiriesByMonth: MonthCount[];
  quoteValueByMonth: MonthValue[];
}

/** Inclusive date range (YYYY-MM-DD) sent to the reporting endpoint. */
export interface DateRange {
  from: string;
  to: string;
}
