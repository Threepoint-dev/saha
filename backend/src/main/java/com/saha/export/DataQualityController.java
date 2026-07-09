package com.saha.export;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Read-only data-quality endpoint (EP-10).
 * {@code GET /api/tenants/{tenantId}/data-quality} returns the completeness score,
 * the list of outstanding setup issues, and summary counts.
 */
@RestController
@RequestMapping("/api/tenants/{tenantId}/data-quality")
public class DataQualityController {

    private final DataQualityService service;

    public DataQualityController(DataQualityService service) {
        this.service = service;
    }

    @GetMapping
    public DataQualityReport report(@PathVariable UUID tenantId) {
        return service.report(tenantId);
    }
}
