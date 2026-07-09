package com.saha.reporting;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Assembles the reporting dashboard snapshot (EP-09) from native aggregate
 * queries. Reads existing data only — no tables are created or modified.
 */
@Service
public class ReportingService {

    private static final DateTimeFormatter MONTH_KEY = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final int TREND_MONTHS = 6;

    private final ReportingRepository repository;

    public ReportingService(ReportingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ReportingSummaryDto summary(UUID tenantId, LocalDate from, LocalDate to) {
        // Default to the last 30 days when the caller supplies no range.
        LocalDate fromDate = from != null ? from : LocalDate.now().minusDays(30);
        LocalDate toDate = to != null ? to : LocalDate.now();
        LocalDate toExclusive = toDate.plusDays(1);

        // Trend charts always cover the last 6 calendar months, independent of the filter.
        YearMonth currentMonth = YearMonth.now();
        LocalDate monthsStart = currentMonth.minusMonths(TREND_MONTHS - 1L).atDay(1);

        // --- Status breakdown + derived KPIs ---
        List<ReportingSummaryDto.StatusCount> byStatus = new ArrayList<>();
        long total = 0;
        long newCount = 0;
        long wonCount = 0;
        long lostCount = 0;
        for (Object[] row : repository.countByStatus(tenantId, fromDate, toExclusive)) {
            String status = row[0] != null ? row[0].toString() : "unknown";
            long count = toLong(row[1]);
            byStatus.add(new ReportingSummaryDto.StatusCount(status, count));
            total += count;
            switch (status.toLowerCase()) {
                case "new" -> newCount += count;
                case "won" -> wonCount += count;
                case "lost" -> lostCount += count;
                default -> { /* other statuses only contribute to the total */ }
            }
        }
        double conversionRate = total > 0 ? round1((wonCount * 100.0) / total) : 0.0;

        // --- Quote value + response time ---
        BigDecimal totalQuoteValue = repository.totalCurrentQuoteValue(tenantId, fromDate, toExclusive);
        if (totalQuoteValue == null) {
            totalQuoteValue = BigDecimal.ZERO;
        }
        totalQuoteValue = totalQuoteValue.setScale(2, RoundingMode.HALF_UP);

        Double avgResponse = repository.avgResponseHours(tenantId, fromDate, toExclusive);
        double avgResponseTimeHours = avgResponse != null ? round1(avgResponse) : 0.0;

        // --- Source breakdown ---
        List<ReportingSummaryDto.SourceCount> bySource = new ArrayList<>();
        for (Object[] row : repository.countBySource(tenantId, fromDate, toExclusive)) {
            String name = row[0] != null ? row[0].toString() : "Unassigned";
            bySource.add(new ReportingSummaryDto.SourceCount(name, toLong(row[1])));
        }

        // --- Trends (6 months, gaps filled with zero) ---
        List<ReportingSummaryDto.MonthCount> inquiriesByMonth =
                fillMonthCounts(repository.inquiriesByMonth(tenantId, monthsStart), currentMonth);
        List<ReportingSummaryDto.MonthValue> quoteValueByMonth =
                fillMonthValues(repository.quoteValueByMonth(tenantId, monthsStart), currentMonth);

        return new ReportingSummaryDto(
                total,
                newCount,
                wonCount,
                lostCount,
                conversionRate,
                totalQuoteValue,
                avgResponseTimeHours,
                byStatus,
                bySource,
                inquiriesByMonth,
                quoteValueByMonth
        );
    }

    private List<ReportingSummaryDto.MonthCount> fillMonthCounts(List<Object[]> rows, YearMonth current) {
        Map<String, Long> found = new LinkedHashMap<>();
        for (Object[] row : rows) {
            found.put(row[0].toString(), toLong(row[1]));
        }
        List<ReportingSummaryDto.MonthCount> out = new ArrayList<>();
        for (String key : monthKeys(current)) {
            out.add(new ReportingSummaryDto.MonthCount(key, found.getOrDefault(key, 0L)));
        }
        return out;
    }

    private List<ReportingSummaryDto.MonthValue> fillMonthValues(List<Object[]> rows, YearMonth current) {
        Map<String, BigDecimal> found = new LinkedHashMap<>();
        for (Object[] row : rows) {
            BigDecimal value = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            found.put(row[0].toString(), value);
        }
        List<ReportingSummaryDto.MonthValue> out = new ArrayList<>();
        for (String key : monthKeys(current)) {
            out.add(new ReportingSummaryDto.MonthValue(
                    key, found.getOrDefault(key, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP)));
        }
        return out;
    }

    private List<String> monthKeys(YearMonth current) {
        List<String> keys = new ArrayList<>();
        for (int i = TREND_MONTHS - 1; i >= 0; i--) {
            keys.add(current.minusMonths(i).format(MONTH_KEY));
        }
        return keys;
    }

    private static long toLong(Object value) {
        return value instanceof Number n ? n.longValue() : 0L;
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
