package com.saha.event;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class CustomerConfirmationController {

    private final CustomerConfirmationService service;

    public CustomerConfirmationController(CustomerConfirmationService service) {
        this.service = service;
    }

    @PostMapping("/api/tenants/{tenantId}/inquiries/{inquiryId}/confirm")
    public EventSummaryDto confirm(@PathVariable UUID tenantId, @PathVariable UUID inquiryId) {
        return service.confirm(tenantId, inquiryId);
    }

    @GetMapping("/api/public/events/{inquiryId}/summary")
    public EventSummaryDto summary(@PathVariable UUID inquiryId) {
        return service.publicSummary(inquiryId);
    }
}
