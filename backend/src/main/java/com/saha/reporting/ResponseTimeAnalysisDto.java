package com.saha.reporting;

import java.util.List;

/**
 * Response Time Analysis (EP-09 / F-30) — first-response speed, distribution,
 * owner/source breakdown, and impact on conversion.
 */
public record ResponseTimeAnalysisDto(
        double medianResponseHours,
        double avgResponseHours,
        Double fastestResponseHours,
        Double slowestResponseHours,
        List<DistributionBucket> distribution,
        List<ConversionBucket> conversionByBucket,
        List<GroupStat> byOwner,
        List<GroupStat> bySource
) {
    public record DistributionBucket(String label, long count, double percent) {}

    public record ConversionBucket(String label, double conversionRate) {}

    /** Used for both "by owner" and "by source" tables — same shape, different grouping key. */
    public record GroupStat(String name, double medianHours, double avgHours, String sla, double conversionRate) {}
}