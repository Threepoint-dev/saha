package com.saha.export;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Builds CSV extracts of existing tenant data (EP-10). Every query is filtered by
 * tenant_id and reads only — no tables are created, altered, or written to.
 */
@Service
public class ExportService {

    private static final List<String> INQUIRY_HEADERS = List.of(
            "inquiry_number", "client_name", "client_phone", "client_email",
            "event_date", "guest_count", "status", "estimated_value",
            "source_channel", "hall", "created_at", "first_response_at");

    private static final String INQUIRY_SQL = """
            SELECT i.inquiry_number   AS "inquiry_number",
                   i.client_name      AS "client_name",
                   i.client_phone     AS "client_phone",
                   i.client_email     AS "client_email",
                   i.event_date       AS "event_date",
                   i.guest_count      AS "guest_count",
                   i.status           AS "status",
                   i.estimated_value  AS "estimated_value",
                   sc.name            AS "source_channel",
                   h.name             AS "hall",
                   i.created_at       AS "created_at",
                   i.first_response_at AS "first_response_at"
            FROM inquiry i
            LEFT JOIN source_channel sc ON sc.id = i.source_channel_id
            LEFT JOIN hall h ON h.id = i.hall_id
            WHERE i.tenant_id = ?
            ORDER BY i.created_at DESC
            """;

    private static final List<String> QUOTE_HEADERS = List.of(
            "quote_number", "inquiry_client_name", "status", "subtotal",
            "vat_amount", "total", "issued_date", "valid_until", "created_at");

    private static final String QUOTE_SQL = """
            SELECT q.quote_number AS "quote_number",
                   i.client_name  AS "inquiry_client_name",
                   q.status       AS "status",
                   q.subtotal     AS "subtotal",
                   q.vat_amount   AS "vat_amount",
                   q.total        AS "total",
                   q.issued_date  AS "issued_date",
                   q.valid_until  AS "valid_until",
                   q.created_at   AS "created_at"
            FROM quote q
            LEFT JOIN inquiry i ON i.id = q.inquiry_id
            WHERE q.tenant_id = ?
            ORDER BY q.created_at DESC
            """;

    private static final List<String> HALL_HEADERS = List.of(
            "name", "short_code", "capacity", "base_price", "default_setup", "status");

    private static final String HALL_SQL = """
            SELECT name          AS "name",
                   short_code    AS "short_code",
                   capacity      AS "capacity",
                   base_price    AS "base_price",
                   default_setup AS "default_setup",
                   status        AS "status"
            FROM hall
            WHERE tenant_id = ?
            ORDER BY created_at DESC
            """;

    private static final List<String> PACKAGE_HEADERS = List.of(
            "name", "description", "price", "is_taxable", "status");

    private static final String PACKAGE_SQL = """
            SELECT name        AS "name",
                   description AS "description",
                   price       AS "price",
                   is_taxable  AS "is_taxable",
                   status      AS "status"
            FROM package
            WHERE tenant_id = ?
            ORDER BY created_at DESC
            """;

    private static final List<String> ADDON_HEADERS = List.of(
            "name", "price", "is_taxable", "status");

    private static final String ADDON_SQL = """
            SELECT name       AS "name",
                   price      AS "price",
                   is_taxable AS "is_taxable",
                   status     AS "status"
            FROM addon
            WHERE tenant_id = ?
            ORDER BY created_at DESC
            """;

    private final JdbcTemplate jdbc;

    public ExportService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public byte[] exportInquiries(UUID tenantId) {
        return export(tenantId, INQUIRY_HEADERS, INQUIRY_SQL);
    }

    @Transactional(readOnly = true)
    public byte[] exportQuotes(UUID tenantId) {
        return export(tenantId, QUOTE_HEADERS, QUOTE_SQL);
    }

    @Transactional(readOnly = true)
    public byte[] exportHalls(UUID tenantId) {
        return export(tenantId, HALL_HEADERS, HALL_SQL);
    }

    @Transactional(readOnly = true)
    public byte[] exportPackages(UUID tenantId) {
        return export(tenantId, PACKAGE_HEADERS, PACKAGE_SQL);
    }

    @Transactional(readOnly = true)
    public byte[] exportAddons(UUID tenantId) {
        return export(tenantId, ADDON_HEADERS, ADDON_SQL);
    }

    private byte[] export(UUID tenantId, List<String> headers, String sql) {
        List<Map<String, Object>> rows = jdbc.queryForList(sql, tenantId);
        List<List<Object>> data = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            List<Object> line = new ArrayList<>(headers.size());
            for (String header : headers) {
                line.add(row.get(header));
            }
            data.add(line);
        }
        return CsvSupport.toCsv(headers, data);
    }
}
