export interface DataQualityIssue {
  entity: string;
  field: string;
  issue: string;
  count: number;
}

export interface DataQualitySummary {
  hotelsComplete: boolean;
  hallsCount: number;
  packagesCount: number;
  addonsCount: number;
  sourceChannelsCount: number;
  quoteSettingsConfigured: boolean;
}

export interface DataQualityReport {
  score: number;
  issues: DataQualityIssue[];
  summary: DataQualitySummary;
}

/** The five CSV extracts offered on the Export & Quality page. */
export type ExportType = 'inquiries' | 'quotes' | 'halls' | 'packages' | 'addons';
