package com.saha.quote;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tenants/{tenantId}/inquiries/{inquiryId}/quotes")
public class QuoteController {

    private final QuoteService service;

    public QuoteController(QuoteService service) {
        this.service = service;
    }

    @GetMapping
    public List<QuoteDto> list(@PathVariable UUID tenantId, @PathVariable UUID inquiryId) {
        return service.list(tenantId, inquiryId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuoteDto create(@PathVariable UUID tenantId, @PathVariable UUID inquiryId,
                           @RequestBody(required = false) CreateQuoteRequest request) {
        return service.create(tenantId, inquiryId, request);
    }

    @GetMapping("/{quoteId}")
    public QuoteDto get(@PathVariable UUID tenantId, @PathVariable UUID inquiryId, @PathVariable UUID quoteId) {
        return service.get(tenantId, quoteId);
    }

    @PutMapping("/{quoteId}")
    public QuoteDto update(@PathVariable UUID tenantId, @PathVariable UUID inquiryId, @PathVariable UUID quoteId,
                           @RequestBody UpdateQuoteRequest request) {
        return service.update(tenantId, quoteId, request);
    }

    @DeleteMapping("/{quoteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable UUID tenantId, @PathVariable UUID inquiryId, @PathVariable UUID quoteId) {
        service.cancel(tenantId, quoteId);
    }

    @PostMapping("/{quoteId}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    public QuoteDto duplicate(@PathVariable UUID tenantId, @PathVariable UUID inquiryId, @PathVariable UUID quoteId) {
        return service.duplicate(tenantId, quoteId);
    }
}
