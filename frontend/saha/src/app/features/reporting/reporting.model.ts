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

/** Filter parameters sent to the reporting endpoint. */
export interface ReportingFilter {
  from?: string;
  to?: string;
  channelId?: string;
  ownerId?: string;
  eventType?: string;
  status?: string;
}

// --- Lost Reason Analysis (EP-09 / F-29) ---

export interface LostReasonBreakdown {
  reason: string;
  count: number;
  percentOfLost: number;
  estimatedValueLost: number;
  urgency: string;
}

export interface LostWeekCount {
  weekLabel: string;
  count: number;
}

export interface LostReasonAnalysis {
  totalLost: number;
  topLeakageReason: string | null;
  highestLostValueReason: string | null;
  mostUrgentReason: string | null;
  breakdown: LostReasonBreakdown[];
  trend: LostWeekCount[];
}

// --- Response Time Analysis (EP-09 / F-30) ---

export interface DistributionBucket {
  label: string;
  count: number;
  percent: number;
}

export interface ConversionBucket {
  label: string;
  conversionRate: number;
}

export interface GroupStat {
  name: string;
  medianHours: number;
  avgHours: number;
  sla: string;
  conversionRate: number;
}

export interface ResponseTimeAnalysis {
  medianResponseHours: number;
  avgResponseHours: number;
  fastestResponseHours: number | null;
  slowestResponseHours: number | null;
  distribution: DistributionBucket[];
  conversionByBucket: ConversionBucket[];
  byOwner: GroupStat[];
  bySource: GroupStat[];
}