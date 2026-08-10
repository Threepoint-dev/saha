package com.saha.reporting;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Lost Reason Analysis (EP-09 / F-29). Ranks loss reasons by how often they
 * happen and by estimated value lost, and flags which ones are most urgent
 * to fix based on a fixed preventability ranking (e.g. "No response from
 * us" is fully within the hotel's control, so it's Critical; "Date
 * unavailable" is largely outside their control, so it's Low).
 */
@Service
public class LostReasonAnalysisService {

    private static final Map<String, String> URGENCY = Map.ofEntries(
            Map.entry("No response from us", "Critical"),
            Map.entry("Chose a competitor", "High"),
            Map.entry("Price too high", "Medium"),
            Map.entry("Client went silent", "Medium"),
            Map.entry("Date unavailable", "Low"),
            Map.entry("Capacity / space", "Low")
    );
    private static final List<String> URGENCY_RANK = List.of("Critical", "High", "Medium", "Low");

    private final ReportingRepository repository;

    public LostReasonAnalysisService(ReportingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public LostReasonAnalysisDto analyze(UUID tenantId, LocalDate from, LocalDate to) {
        LocalDate fromDate = from != null ? from : LocalDate.now().minusMonths(3);
        LocalDate toExclusive = (to != null ? to : LocalDate.now()).plusDays(1);

        List<Object[]> rows = repository.lostReasonBreakdown(tenantId, fromDate, toExclusive);
        long total = rows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();

        List<LostReasonAnalysisDto.ReasonBreakdown> breakdown = new ArrayList<>();
        for (Object[] r : rows) {
            String reason = (String) r[0];
            long count = ((Number) r[1]).longValue();
            BigDecimal value = r[2] != null ? new BigDecimal(r[2].toString()) : BigDecimal.ZERO;
            double pct = total > 0 ? (count * 100.0 / total) : 0;
            String urgency = URGENCY.getOrDefault(reason, "Medium");
            breakdown.add(new LostReasonAnalysisDto.ReasonBreakdown(reason, count, pct, value, urgency));
        }

        String topLeakage = breakdown.stream()
                .max(Comparator.comparingLong(LostReasonAnalysisDto.ReasonBreakdown::count))
                .map(LostReasonAnalysisDto.ReasonBreakdown::reason)
                .orElse(null);

        String highestValue = breakdown.stream()
                .max(Comparator.comparing(LostReasonAnalysisDto.ReasonBreakdown::estimatedValueLost))
                .map(LostReasonAnalysisDto.ReasonBreakdown::reason)
                .orElse(null);

        String mostUrgent = breakdown.stream()
                .min(Comparator.comparingInt(b -> URGENCY_RANK.indexOf(b.urgency())))
                .map(LostReasonAnalysisDto.ReasonBreakdown::reason)
                .orElse(null);

        LocalDate weeksStart = LocalDate.now().minusWeeks(6);
        List<Object[]> trendRows = repository.lostTrendByWeek(tenantId, weeksStart);
        List<LostReasonAnalysisDto.WeekCount> trend = new ArrayList<>();
        for (Object[] r : trendRows) {
            trend.add(new LostReasonAnalysisDto.WeekCount((String) r[0], ((Number) r[1]).longValue()));
        }

        return new LostReasonAnalysisDto((int) total, topLeakage, highestValue, mostUrgent, breakdown, trend);
    }
}