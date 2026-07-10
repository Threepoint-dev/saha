package com.saha.export;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Computes the tenant data-quality report (EP-10). Runs a fixed set of setup
 * checks and derives a 0-100 completeness score. Reads existing data only.
 */
@Service
public class DataQualityService {

    /** Total number of setup checks that make up the score. */
    private static final int TOTAL_CHECKS = 5;

    private final JdbcTemplate jdbc;

    public DataQualityService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public DataQualityReport report(UUID tenantId) {
        List<DataQualityReport.Issue> issues = new ArrayList<>();
        int passed = 0;

        // --- Check 1: hotel profile has name + phone + address ---
        List<Map<String, Object>> hotelRows = jdbc.queryForList(
                "SELECT name, phone, address FROM hotel_tenant WHERE id = ?", tenantId);
        List<String> missingHotelFields = new ArrayList<>();
        if (hotelRows.isEmpty()) {
            missingHotelFields.addAll(List.of("name", "phone", "address"));
        } else {
            Map<String, Object> hotel = hotelRows.get(0);
            if (isBlank(hotel.get("name"))) {
                missingHotelFields.add("name");
            }
            if (isBlank(hotel.get("phone"))) {
                missingHotelFields.add("phone");
            }
            if (isBlank(hotel.get("address"))) {
                missingHotelFields.add("address");
            }
        }
        boolean hotelsComplete = missingHotelFields.isEmpty();
        if (hotelsComplete) {
            passed++;
        } else {
            issues.add(new DataQualityReport.Issue(
                    "Hotel", String.join(", ", missingHotelFields),
                    "Hotel profile is missing required fields", missingHotelFields.size()));
        }

        // --- Check 2: at least 1 active hall ---
        long hallsCount = count("SELECT count(*) FROM hall WHERE tenant_id = ? AND status = 'active'", tenantId);
        if (hallsCount > 0) {
            passed++;
        } else {
            issues.add(new DataQualityReport.Issue(
                    "Halls", "status", "No active halls configured", 0));
        }

        // --- Check 3: at least 1 active package ---
        long packagesCount = count("SELECT count(*) FROM package WHERE tenant_id = ? AND status = 'active'", tenantId);
        if (packagesCount > 0) {
            passed++;
        } else {
            issues.add(new DataQualityReport.Issue(
                    "Packages", "status", "No active packages configured", 0));
        }

        // --- Check 4: at least 1 active source channel ---
        long sourceChannelsCount = count(
                "SELECT count(*) FROM source_channel WHERE tenant_id = ? AND is_active = true", tenantId);
        if (sourceChannelsCount > 0) {
            passed++;
        } else {
            issues.add(new DataQualityReport.Issue(
                    "Source Channels", "is_active", "No active source channels configured", 0));
        }

        // --- Check 5: quote settings configured ---
        long quoteSettings = count("SELECT count(*) FROM quote_settings WHERE tenant_id = ?", tenantId);
        boolean quoteSettingsConfigured = quoteSettings > 0;
        if (quoteSettingsConfigured) {
            passed++;
        } else {
            issues.add(new DataQualityReport.Issue(
                    "Quote Settings", "quote_settings", "Quote & VAT settings not configured", 0));
        }

        // Addons are reported in the summary but do not gate the score.
        long addonsCount = count("SELECT count(*) FROM addon WHERE tenant_id = ? AND status = 'active'", tenantId);

        int score = Math.round((passed * 100.0f) / TOTAL_CHECKS);

        DataQualityReport.Summary summary = new DataQualityReport.Summary(
                hotelsComplete, hallsCount, packagesCount, addonsCount,
                sourceChannelsCount, quoteSettingsConfigured);

        return new DataQualityReport(score, issues, summary);
    }

    private long count(String sql, UUID tenantId) {
        Long value = jdbc.queryForObject(sql, Long.class, tenantId);
        return value != null ? value : 0L;
    }

    private static boolean isBlank(Object value) {
        return value == null || value.toString().trim().isEmpty();
    }
}
