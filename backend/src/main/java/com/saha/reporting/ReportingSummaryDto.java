package com.saha.reporting;

import java.math.BigDecimal;
import java.util.List;

/**
 * Aggregated read-only snapshot for the measurement &amp; reporting dashboard
 * (EP-09). Every figure is scoped to a single tenant and, where applicable, to
 * an optional inquiry.created_at date range. This DTO is assembled from native
 * aggregate queries; it never maps or mutates any table directly.
 */
public record ReportingSummaryDto(
        long totalInquiries,
        long newInquiries,
        long wonInquiries,
        long lostInquiries,
        double conversionRate,
        BigDecimal totalQuoteValue,
        double avgResponseTimeHours,
        List<StatusCount> inquiriesByStatus,
        List<SourceCount> inquiriesBySource,
        List<MonthCount> inquiriesByMonth,
        List<MonthValue> quoteValueByMonth
) {
    public record StatusCount(String status, long count) {}

    public record SourceCount(String sourceName, long count) {}

    public record MonthCount(String month, long count) {}

    public record MonthValue(String month, BigDecimal value) {}
}
