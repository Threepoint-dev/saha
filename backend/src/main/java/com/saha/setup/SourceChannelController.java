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
@RequestMapping("/api/tenants/{tenantId}/source-channels")
public class SourceChannelController {

    private final SourceChannelService service;

    public SourceChannelController(SourceChannelService service) {
        this.service = service;
    }

    @GetMapping
    public List<SourceChannelDto> list(@PathVariable UUID tenantId) {
        return service.list(tenantId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SourceChannelDto create(@PathVariable UUID tenantId,
                                   @Valid @RequestBody SourceChannelUpsertRequest request) {
        return service.create(tenantId, request);
    }

    @PutMapping("/{id}")
    public SourceChannelDto update(@PathVariable UUID tenantId, @PathVariable UUID id,
                                   @Valid @RequestBody SourceChannelUpsertRequest request) {
        return service.update(tenantId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID tenantId, @PathVariable UUID id) {
        service.delete(tenantId, id);
    }
}
