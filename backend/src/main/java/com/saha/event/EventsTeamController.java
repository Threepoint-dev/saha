package com.saha.event;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Events Team Request Tracker & Detail (EP-08). See EventsTeamService for
 * the "only visible after BEO shared" rule and the operational-only field
 * set (no pricing, margins, discounts, or negotiation notes).
 */
@RestController
@RequestMapping("/api/tenants/{tenantId}/events-team/requests")
public class EventsTeamController {

    private final EventsTeamService service;

    public EventsTeamController(EventsTeamService service) {
        this.service = service;
    }

    @GetMapping
    public List<EventsTeamRequestDto> list(@PathVariable UUID tenantId) {
        return service.listRequests(tenantId);
    }

    @GetMapping("/{inquiryId}")
    public EventsTeamRequestDetailDto detail(@PathVariable UUID tenantId, @PathVariable UUID inquiryId) {
        return service.getDetail(tenantId, inquiryId);
    }

    @PatchMapping("/{inquiryId}/status")
    public EventsTeamRequestDto updateStatus(@PathVariable UUID tenantId, @PathVariable UUID inquiryId,
                                             @RequestBody PreparationStatusUpdateRequest request) {
        return service.updatePreparationStatus(tenantId, inquiryId, request);
    }
}