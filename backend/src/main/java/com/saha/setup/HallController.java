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
@RequestMapping("/api/tenants/{tenantId}/halls")
public class HallController {

    private final HallService service;

    public HallController(HallService service) {
        this.service = service;
    }

    @GetMapping
    public List<HallDto> list(@PathVariable UUID tenantId) {
        return service.listActive(tenantId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HallDto create(@PathVariable UUID tenantId, @Valid @RequestBody HallUpsertRequest request) {
        return service.create(tenantId, request);
    }

    @PutMapping("/{id}")
    public HallDto update(@PathVariable UUID tenantId, @PathVariable UUID id,
                          @Valid @RequestBody HallUpsertRequest request) {
        return service.update(tenantId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@PathVariable UUID tenantId, @PathVariable UUID id) {
        service.archive(tenantId, id);
    }
}
