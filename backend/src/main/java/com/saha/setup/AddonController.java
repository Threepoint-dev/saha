package com.saha.setup;

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
@RequestMapping("/api/tenants/{tenantId}/addons")
public class AddonController {

    private final AddonService service;

    public AddonController(AddonService service) {
        this.service = service;
    }

    @GetMapping
    public List<AddonDto> list(@PathVariable UUID tenantId) {
        return service.listActive(tenantId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddonDto create(@PathVariable UUID tenantId, @Valid @RequestBody AddonUpsertRequest request) {
        return service.create(tenantId, request);
    }

    @PutMapping("/{id}")
    public AddonDto update(@PathVariable UUID tenantId, @PathVariable UUID id,
                           @Valid @RequestBody AddonUpsertRequest request) {
        return service.update(tenantId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@PathVariable UUID tenantId, @PathVariable UUID id) {
        service.archive(tenantId, id);
    }
}
