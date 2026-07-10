package com.saha.setup;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/tenants/{tenantId}/quote-settings")
public class QuoteSettingsController {

    private final QuoteSettingsService service;

    public QuoteSettingsController(QuoteSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public QuoteSettingsDto get(@PathVariable UUID tenantId) {
        return service.get(tenantId);
    }

    @PutMapping
    public QuoteSettingsDto upsert(@PathVariable UUID tenantId,
                                   @Valid @RequestBody QuoteSettingsUpsertRequest request) {
        return service.upsert(tenantId, request);
    }
}
