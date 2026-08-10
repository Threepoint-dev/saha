package com.saha.event;

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

import java.util.UUID;

@RestController
@RequestMapping("/api/tenants/{tenantId}/inquiries/{inquiryId}/event-setup")
public class EventSetupController {

    private final EventSetupService service;

    public EventSetupController(EventSetupService service) {
        this.service = service;
    }

    @GetMapping
    public EventSetupDto get(@PathVariable UUID tenantId, @PathVariable UUID inquiryId) {
        return service.get(tenantId, inquiryId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventSetupDto create(@PathVariable UUID tenantId, @PathVariable UUID inquiryId,
                                @RequestBody(required = false) EventSetupRequest request) {
        return service.create(tenantId, inquiryId, request != null ? request : emptyRequest());
    }

    @PutMapping
    public EventSetupDto update(@PathVariable UUID tenantId, @PathVariable UUID inquiryId,
                                @RequestBody EventSetupRequest request) {
        return service.update(tenantId, inquiryId, request);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID tenantId, @PathVariable UUID inquiryId) {
        service.delete(tenantId, inquiryId);
    }

    private EventSetupRequest emptyRequest() {
        return new EventSetupRequest(null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null);
    }
}