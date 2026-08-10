package com.saha.reporting;

import com.saha.model.Inquiry;
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
              AND (CAST(:channelId AS uuid) IS NULL OR i.source_channel_id = CAST(:channelId AS uuid))
              AND (CAST(:ownerId AS uuid) IS NULL OR i.owner_id = CAST(:ownerId AS uuid))
              AND (CAST(:eventType AS text) IS NULL OR i.event_type = CAST(:eventType AS text))
              AND (CAST(:status AS text) IS NULL OR i.status = CAST(:status AS text))
            GROUP BY i.status
            ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> countByStatus(@Param("tenantId") UUID tenantId,
                                 @Param("fromDate") LocalDate fromDate,
                                 @Param("toExclusive") LocalDate toExclusive,
                                 @Param("channelId") UUID channelId,
                                 @Param("ownerId") UUID ownerId,
                                 @Param("eventType") String eventType,
                                 @Param("status") String status);

    @Query(value = """
            SELECT COALESCE(SUM(q.total), 0)
            FROM quote q
            JOIN inquiry i ON i.id = q.inquiry_id
            WHERE q.tenant_id = :tenantId
              AND q.is_current = true
              AND (q.status IS NULL OR q.status <> 'cancelled')
              AND i.created_at >= :fromDate
              AND i.created_at < :toExclusive
              AND (CAST(:channelId AS uuid) IS NULL OR i.source_channel_id = CAST(:channelId AS uuid))
              AND (CAST(:ownerId AS uuid) IS NULL OR i.owner_id = CAST(:ownerId AS uuid))
              AND (CAST(:eventType AS text) IS NULL OR i.event_type = CAST(:eventType AS text))
              AND (CAST(:status AS text) IS NULL OR i.status = CAST(:status AS text))
            """, nativeQuery = true)
    java.math.BigDecimal totalCurrentQuoteValue(@Param("tenantId") UUID tenantId,
                                                @Param("fromDate") LocalDate fromDate,
                                                @Param("toExclusive") LocalDate toExclusive,
                                                @Param("channelId") UUID channelId,
                                                @Param("ownerId") UUID ownerId,
                                                @Param("eventType") String eventType,
                                                @Param("status") String status);

    @Query(value = """
            SELECT AVG(EXTRACT(EPOCH FROM (i.first_response_at - i.created_at)) / 3600.0)
            FROM inquiry i
            WHERE i.tenant_id = :tenantId
              AND i.first_response_at IS NOT NULL
              AND i.created_at >= :fromDate
              AND i.created_at < :toExclusive
              AND (CAST(:channelId AS uuid) IS NULL OR i.source_channel_id = CAST(:channelId AS uuid))
              AND (CAST(:ownerId AS uuid) IS NULL OR i.owner_id = CAST(:ownerId AS uuid))
              AND (CAST(:eventType AS text) IS NULL OR i.event_type = CAST(:eventType AS text))
              AND (CAST(:status AS text) IS NULL OR i.status = CAST(:status AS text))
            """, nativeQuery = true)
    Double avgResponseHours(@Param("tenantId") UUID tenantId,
                            @Param("fromDate") LocalDate fromDate,
                            @Param("toExclusive") LocalDate toExclusive,
                            @Param("channelId") UUID channelId,
                            @Param("ownerId") UUID ownerId,
                            @Param("eventType") String eventType,
                            @Param("status") String status);

    @Query(value = """
            SELECT COALESCE(sc.name, 'Unassigned') AS source_name, COUNT(*) AS cnt
            FROM inquiry i
            LEFT JOIN source_channel sc ON sc.id = i.source_channel_id
            WHERE i.tenant_id = :tenantId
              AND i.created_at >= :fromDate
              AND i.created_at < :toExclusive
              AND (CAST(:channelId AS uuid) IS NULL OR i.source_channel_id = CAST(:channelId AS uuid))
              AND (CAST(:ownerId AS uuid) IS NULL OR i.owner_id = CAST(:ownerId AS uuid))
              AND (CAST(:eventType AS text) IS NULL OR i.event_type = CAST(:eventType AS text))
              AND (CAST(:status AS text) IS NULL OR i.status = CAST(:status AS text))
            GROUP BY COALESCE(sc.name, 'Unassigned')
            ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> countBySource(@Param("tenantId") UUID tenantId,
                                 @Param("fromDate") LocalDate fromDate,
                                 @Param("toExclusive") LocalDate toExclusive,
                                 @Param("channelId") UUID channelId,
                                 @Param("ownerId") UUID ownerId,
                                 @Param("eventType") String eventType,
                                 @Param("status") String status);

    // --- Trend queries (fixed to the last 6 months, independent of the date filter, but should respect the other filters!) ---

    @Query(value = """
            SELECT to_char(date_trunc('month', i.created_at), 'YYYY-MM') AS ym, COUNT(*) AS cnt
            FROM inquiry i
            WHERE i.tenant_id = :tenantId
              AND i.created_at >= :monthsStart
              AND (CAST(:channelId AS uuid) IS NULL OR i.source_channel_id = CAST(:channelId AS uuid))
              AND (CAST(:ownerId AS uuid) IS NULL OR i.owner_id = CAST(:ownerId AS uuid))
              AND (CAST(:eventType AS text) IS NULL OR i.event_type = CAST(:eventType AS text))
              AND (CAST(:status AS text) IS NULL OR i.status = CAST(:status AS text))
            GROUP BY date_trunc('month', i.created_at)
            ORDER BY date_trunc('month', i.created_at)
            """, nativeQuery = true)
    List<Object[]> inquiriesByMonth(@Param("tenantId") UUID tenantId,
                                    @Param("monthsStart") LocalDate monthsStart,
                                    @Param("channelId") UUID channelId,
                                    @Param("ownerId") UUID ownerId,
                                    @Param("eventType") String eventType,
                                    @Param("status") String status);

    @Query(value = """
            SELECT to_char(date_trunc('month', q.created_at), 'YYYY-MM') AS ym, COALESCE(SUM(q.total), 0) AS val
            FROM quote q
            JOIN inquiry i ON i.id = q.inquiry_id
            WHERE q.tenant_id = :tenantId
              AND q.is_current = true
              AND (q.status IS NULL OR q.status <> 'cancelled')
              AND q.created_at >= :monthsStart
              AND (CAST(:channelId AS uuid) IS NULL OR i.source_channel_id = CAST(:channelId AS uuid))
              AND (CAST(:ownerId AS uuid) IS NULL OR i.owner_id = CAST(:ownerId AS uuid))
              AND (CAST(:eventType AS text) IS NULL OR i.event_type = CAST(:eventType AS text))
              AND (CAST(:status AS text) IS NULL OR i.status = CAST(:status AS text))
            GROUP BY date_trunc('month', q.created_at)
            ORDER BY date_trunc('month', q.created_at)
            """, nativeQuery = true)
    List<Object[]> quoteValueByMonth(@Param("tenantId") UUID tenantId,
                                     @Param("monthsStart") LocalDate monthsStart,
                                     @Param("channelId") UUID channelId,
                                     @Param("ownerId") UUID ownerId,
                                     @Param("eventType") String eventType,
                                     @Param("status") String status);

    // --- Lost Reason Analysis (EP-09 / F-29) ---

    @Query(value = """
            SELECT COALESCE(i.loss_reason, 'Other') AS reason, COUNT(*) AS cnt, COALESCE(SUM(i.estimated_value), 0) AS val
            FROM inquiry i
            WHERE i.tenant_id = :tenantId
              AND i.status = 'LOST'
              AND i.updated_at >= :fromDate
              AND i.updated_at < :toExclusive
            GROUP BY COALESCE(i.loss_reason, 'Other')
            ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> lostReasonBreakdown(@Param("tenantId") UUID tenantId,
                                       @Param("fromDate") LocalDate fromDate,
                                       @Param("toExclusive") LocalDate toExclusive);

    @Query(value = """
            SELECT to_char(date_trunc('week', i.updated_at), 'YYYY-MM-DD') AS wk, COUNT(*) AS cnt
            FROM inquiry i
            WHERE i.tenant_id = :tenantId
              AND i.status = 'LOST'
              AND i.updated_at >= :weeksStart
            GROUP BY date_trunc('week', i.updated_at)
            ORDER BY date_trunc('week', i.updated_at)
            """, nativeQuery = true)
    List<Object[]> lostTrendByWeek(@Param("tenantId") UUID tenantId,
                                   @Param("weeksStart") LocalDate weeksStart);

    // --- Response Time Analysis (EP-09 / F-30) ---
    // Returns one row per responded inquiry: owner name, source name, response
    // hours, and status. All bucketing/median/SLA classification happens in
    // Java (ResponseTimeAnalysisService) — pilot data volume is small enough
    // that in-memory aggregation is simpler and clearer than nested SQL CASE
    // statements for every metric.

    @Query(value = """
            SELECT COALESCE(hu.full_name, 'Unassigned') AS owner_name,
                   COALESCE(sc.name, 'Unassigned') AS source_name,
                   EXTRACT(EPOCH FROM (i.first_response_at - i.created_at)) / 3600.0 AS response_hours,
                   i.status AS status
            FROM inquiry i
            LEFT JOIN hotel_user hu ON hu.id = i.owner_id
            LEFT JOIN source_channel sc ON sc.id = i.source_channel_id
            WHERE i.tenant_id = :tenantId
              AND i.first_response_at IS NOT NULL
              AND i.created_at >= :fromDate
              AND i.created_at < :toExclusive
            """, nativeQuery = true)
    List<Object[]> responseTimeRows(@Param("tenantId") UUID tenantId,
                                    @Param("fromDate") LocalDate fromDate,
                                    @Param("toExclusive") LocalDate toExclusive);
}