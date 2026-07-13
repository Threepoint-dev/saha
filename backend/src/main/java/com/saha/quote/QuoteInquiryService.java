package com.saha.quote;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class QuoteInquiryService {

    private final QuoteInquiryRepository repository;

    public QuoteInquiryService(QuoteInquiryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public InquirySummaryDto get(UUID tenantId, UUID inquiryId) {
        return repository.findByIdAndTenantId(inquiryId, tenantId)
                .map(InquirySummaryDto::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquiry not found"));
    }
}
