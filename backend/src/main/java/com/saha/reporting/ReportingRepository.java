package com.saha.reporting;

import com.saha.quote.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Native aggregate queries for the reporting dashboard. Bound to the existing
 * read-only {@link Inquiry} entity purely to satisfy the {@link JpaRepository}
 * type parameter — this repository only ever runs read-only aggregates and
 * never writes. Every query is filtered by tenant_id.
 *
 * <p>Date-range parameters are always supplied as concrete bounds by the
 * service (never null) to avoid Postgres "could not determine data type"
 * errors on optional parameters. {@code toExclusive} is the day after the
 * requested end date so the range is inclusive of the whole end day.
 */
public interface ReportingRepository extends JpaRepository<Inquiry, UUID> {

    // --- KPI / breakdown queries (respect the date range) ---

    @Query(value = """
            SELECT i.status AS status, COUNT(*) AS cnt
            FROM inquiry i
            WHERE i.tenant_id = :tenantId
              AND i.created_at >= :fromDate
              AND i.created_at < :toExclusive
            GROUP BY i.status
            ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> countByStatus(@Param("tenantId") UUID tenantId,
                                 @Param("fromDate") LocalDate fromDate,
                                 @Param("toExclusive") LocalDate toExclusive);

    @Query(value = """
            SELECT COALESCE(SUM(q.total), 0)
            FROM quote q
            JOIN inquiry i ON i.id = q.inquiry_id
            WHERE q.tenant_id = :tenantId
              AND q.is_current = true
              AND (q.status IS NULL OR q.status <> 'cancelled')
              AND i.created_at >= :fromDate
              AND i.created_at < :toExclusive
            """, nativeQuery = true)
    java.math.BigDecimal totalCurrentQuoteValue(@Param("tenantId") UUID tenantId,
                                                @Param("fromDate") LocalDate fromDate,
                                                @Param("toExclusive") LocalDate toExclusive);

    @Query(value = """
            SELECT AVG(EXTRACT(EPOCH FROM (i.first_response_at - i.created_at)) / 3600.0)
            FROM inquiry i
            WHERE i.tenant_id = :tenantId
              AND i.first_response_at IS NOT NULL
              AND i.created_at >= :fromDate
              AND i.created_at < :toExclusive
            """, nativeQuery = true)
    Double avgResponseHours(@Param("tenantId") UUID tenantId,
                            @Param("fromDate") LocalDate fromDate,
                            @Param("toExclusive") LocalDate toExclusive);

    @Query(value = """
            SELECT COALESCE(sc.name, 'Unassigned') AS source_name, COUNT(*) AS cnt
            FROM inquiry i
            LEFT JOIN source_channel sc ON sc.id = i.source_channel_id
            WHERE i.tenant_id = :tenantId
              AND i.created_at >= :fromDate
              AND i.created_at < :toExclusive
            GROUP BY COALESCE(sc.name, 'Unassigned')
            ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> countBySource(@Param("tenantId") UUID tenantId,
                                 @Param("fromDate") LocalDate fromDate,
                                 @Param("toExclusive") LocalDate toExclusive);

    // --- Trend queries (fixed to the last 6 months, independent of the filter) ---

    @Query(value = """
            SELECT to_char(date_trunc('month', i.created_at), 'YYYY-MM') AS ym, COUNT(*) AS cnt
            FROM inquiry i
            WHERE i.tenant_id = :tenantId
              AND i.created_at >= :monthsStart
            GROUP BY date_trunc('month', i.created_at)
            ORDER BY date_trunc('month', i.created_at)
            """, nativeQuery = true)
    List<Object[]> inquiriesByMonth(@Param("tenantId") UUID tenantId,
                                    @Param("monthsStart") LocalDate monthsStart);

    @Query(value = """
            SELECT to_char(date_trunc('month', q.created_at), 'YYYY-MM') AS ym, COALESCE(SUM(q.total), 0) AS val
            FROM quote q
            WHERE q.tenant_id = :tenantId
              AND q.is_current = true
              AND (q.status IS NULL OR q.status <> 'cancelled')
              AND q.created_at >= :monthsStart
            GROUP BY date_trunc('month', q.created_at)
            ORDER BY date_trunc('month', q.created_at)
            """, nativeQuery = true)
    List<Object[]> quoteValueByMonth(@Param("tenantId") UUID tenantId,
                                     @Param("monthsStart") LocalDate monthsStart);
}
