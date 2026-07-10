package com.saha.setup;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/tenants/{tenantId}")
public class ReadinessController {

    private final ReadinessService service;

    public ReadinessController(ReadinessService service) {
        this.service = service;
    }

    @GetMapping("/readiness")
    public ReadinessDto getReadiness(@PathVariable UUID tenantId) {
        return service.getReadiness(tenantId);
    }
}
