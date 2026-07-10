package com.saha.reporting;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Read-only measurement &amp; reporting endpoints (EP-09).
 * {@code GET /api/tenants/{tenantId}/reports/summary} returns the full dashboard
 * snapshot, optionally filtered by an inquiry.created_at date range.
 */
@RestController
@RequestMapping("/api/tenants/{tenantId}/reports")
public class ReportingController {

    private final ReportingService service;

    public ReportingController(ReportingService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    public ReportingSummaryDto summary(
            @PathVariable UUID tenantId,
            @RequestParam(name = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.summary(tenantId, from, to);
    }
}
