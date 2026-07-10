package com.saha.quote;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/tenants/{tenantId}/inquiries/{inquiryId}")
public class InquiryController {

    private final InquiryService service;

    public InquiryController(InquiryService service) {
        this.service = service;
    }

    @GetMapping
    public InquirySummaryDto get(@PathVariable UUID tenantId, @PathVariable UUID inquiryId) {
        return service.get(tenantId, inquiryId);
    }
}
