package com.saha.event;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Events Director Dashboard (EP-08) — hall load, revenue value, event requests. */
@RestController
@RequestMapping("/api/tenants/{tenantId}/events-team/dashboard")
public class EventsDirectorDashboardController {

    private final EventsDirectorDashboardService service;

    public EventsDirectorDashboardController(EventsDirectorDashboardService service) {
        this.service = service;
    }

    @GetMapping
    public EventsDirectorDashboardDto get(@PathVariable UUID tenantId) {
        return service.getDashboard(tenantId);
    }
}