package com.saha.event;

import jakarta.validation.Valid;
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
@RequestMapping("/api/tenants/{tenantId}/event-setups/{eventSetupId}/addons")
public class EventAddonController {

    private final EventAddonService service;

    public EventAddonController(EventAddonService service) {
        this.service = service;
    }

    @GetMapping
    public List<EventAddonDto> list(@PathVariable UUID tenantId, @PathVariable UUID eventSetupId) {
        return service.list(tenantId, eventSetupId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventAddonDto add(@PathVariable UUID tenantId, @PathVariable UUID eventSetupId,
                             @Valid @RequestBody EventAddonRequest request) {
        return service.add(tenantId, eventSetupId, request);
    }

    @PutMapping("/{addonId}")
    public EventAddonDto updateQuantity(@PathVariable UUID tenantId, @PathVariable UUID eventSetupId,
                                        @PathVariable UUID addonId,
                                        @Valid @RequestBody EventAddonQuantityRequest request) {
        return service.updateQuantity(tenantId, eventSetupId, addonId, request);
    }

    @DeleteMapping("/{addonId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable UUID tenantId, @PathVariable UUID eventSetupId, @PathVariable UUID addonId) {
        service.remove(tenantId, eventSetupId, addonId);
    }
}
