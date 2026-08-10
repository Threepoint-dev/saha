package com.saha.reporting;

import java.math.BigDecimal;
import java.util.List;

/**
 * Lost Reason Analysis (EP-09 / F-29) — why inquiries are lost, and where
 * revenue leakage happens. "Urgency" is a fixed business ranking of how
 * preventable / avoidable each reason is (see LostReasonAnalysisService),
 * not raw data.
 */
public record LostReasonAnalysisDto(
        int totalLost,
        String topLeakageReason,
        String highestLostValueReason,
        String mostUrgentReason,
        List<ReasonBreakdown> breakdown,
        List<WeekCount> trend
) {
    public record ReasonBreakdown(
            String reason,
            long count,
            double percentOfLost,
            BigDecimal estimatedValueLost,
            String urgency
    ) {}

    public record WeekCount(String weekLabel, long count) {}
}