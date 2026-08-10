package com.saha.reporting;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Response Time Analysis (EP-09 / F-30). Fetches one row per responded
 * inquiry (owner, source, response hours, status) and does all bucketing,
 * median, and SLA classification here in Java — simpler to read and verify
 * than the equivalent nested SQL, and pilot data volumes are small.
 */
@Service
public class ResponseTimeAnalysisService {

    private record Row(String owner, String source, double hours, boolean won) {}

    private final ReportingRepository repo;

    public ResponseTimeAnalysisService(ReportingRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public ResponseTimeAnalysisDto analyze(UUID tenantId, LocalDate from, LocalDate to) {
        LocalDate fromDate = from != null ? from : LocalDate.now().minusMonths(3);
        LocalDate toExclusive = (to != null ? to : LocalDate.now()).plusDays(1);

        List<Row> rows = loadRows(tenantId, fromDate, toExclusive);

        List<Double> allHours = rows.stream().map(Row::hours).sorted().toList();
        double median = median(allHours);
        double avg = allHours.isEmpty() ? 0 : allHours.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        Double fastest = allHours.isEmpty() ? null : allHours.get(0);
        Double slowest = allHours.isEmpty() ? null : allHours.get(allHours.size() - 1);

        List<ResponseTimeAnalysisDto.DistributionBucket> distribution = buildDistribution(rows);
        List<ResponseTimeAnalysisDto.ConversionBucket> conversionByBucket = buildConversionByBucket(rows);
        List<ResponseTimeAnalysisDto.GroupStat> byOwner = groupStats(rows, Row::owner);
        List<ResponseTimeAnalysisDto.GroupStat> bySource = groupStats(rows, Row::source);

        return new ResponseTimeAnalysisDto(median, avg, fastest, slowest, distribution, conversionByBucket, byOwner, bySource);
    }

    private List<Row> loadRows(UUID tenantId, LocalDate fromDate, LocalDate toExclusive) {
        return repo.responseTimeRows(tenantId, fromDate, toExclusive).stream()
                .map(r -> new Row(
                        (String) r[0],
                        (String) r[1],
                        r[2] != null ? ((Number) r[2]).doubleValue() : 0.0,
                        "WON".equals(r[3])
                ))
                .toList();
    }

    private double median(List<Double> sortedValues) {
        if (sortedValues.isEmpty()) return 0;
        int n = sortedValues.size();
        if (n % 2 == 1) {
            return sortedValues.get(n / 2);
        }
        return (sortedValues.get(n / 2 - 1) + sortedValues.get(n / 2)) / 2.0;
    }

    private String bucketFor(double hours) {
        if (hours < 0.5) return "< 30 min";
        if (hours < 2) return "30 min – 2h";
        if (hours < 8) return "2h – 8h";
        if (hours < 24) return "8h – 24h";
        return "> 24h";
    }

    private static final List<String> BUCKET_ORDER = List.of("< 30 min", "30 min – 2h", "2h – 8h", "8h – 24h", "> 24h");

    private List<ResponseTimeAnalysisDto.DistributionBucket> buildDistribution(List<Row> rows) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String b : BUCKET_ORDER) counts.put(b, 0L);
        for (Row r : rows) {
            counts.merge(bucketFor(r.hours()), 1L, Long::sum);
        }
        long total = rows.size();
        List<ResponseTimeAnalysisDto.DistributionBucket> result = new ArrayList<>();
        for (String b : BUCKET_ORDER) {
            long count = counts.get(b);
            double pct = total > 0 ? (count * 100.0 / total) : 0;
            result.add(new ResponseTimeAnalysisDto.DistributionBucket(b, count, pct));
        }
        return result;
    }

    private List<ResponseTimeAnalysisDto.ConversionBucket> buildConversionByBucket(List<Row> rows) {
        Map<String, List<Row>> byBucket = new LinkedHashMap<>();
        for (String b : BUCKET_ORDER) byBucket.put(b, new ArrayList<>());
        for (Row r : rows) {
            byBucket.get(bucketFor(r.hours())).add(r);
        }
        List<ResponseTimeAnalysisDto.ConversionBucket> result = new ArrayList<>();
        for (String b : BUCKET_ORDER) {
            List<Row> group = byBucket.get(b);
            double rate = conversionRate(group);
            result.add(new ResponseTimeAnalysisDto.ConversionBucket(b, rate));
        }
        return result;
    }

    private List<ResponseTimeAnalysisDto.GroupStat> groupStats(List<Row> rows, java.util.function.Function<Row, String> key) {
        Map<String, List<Row>> grouped = new LinkedHashMap<>();
        for (Row r : rows) {
            grouped.computeIfAbsent(key.apply(r), k -> new ArrayList<>()).add(r);
        }
        List<ResponseTimeAnalysisDto.GroupStat> result = new ArrayList<>();
        for (Map.Entry<String, List<Row>> e : grouped.entrySet()) {
            List<Double> hours = e.getValue().stream().map(Row::hours).sorted().toList();
            double med = median(hours);
            double avg = hours.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            String sla = slaFor(med);
            double conv = conversionRate(e.getValue());
            result.add(new ResponseTimeAnalysisDto.GroupStat(e.getKey(), med, avg, sla, conv));
        }
        // Fastest median first.
        result.sort((a, b) -> Double.compare(a.medianHours(), b.medianHours()));
        return result;
    }

    private double conversionRate(List<Row> group) {
        if (group.isEmpty()) return 0;
        long won = group.stream().filter(Row::won).count();
        return won * 100.0 / group.size();
    }

    private String slaFor(double medianHours) {
        if (medianHours < 1) return "Fast";
        if (medianHours < 4) return "Acceptable";
        if (medianHours < 12) return "Slow";
        return "At Risk";
    }
}