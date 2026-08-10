package com.saha.controller;

import com.saha.dto.HallAvailabilityDto;
import com.saha.dto.HallAvailabilityUpsertRequest;
import com.saha.service.HallAvailabilityConflictException;
import com.saha.service.HallAvailabilityService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Internal hall availability calendar (EP-07). Read-only for scheduling
 * checks; blocks are created/edited by Sales Reps and Directors of Sales to
 * record tentative holds, confirmed events, maintenance, or other blocks.
 * There is no public booking here — this only prevents the hotel's own team
 * from double-booking a hall.
 */
@RestController
@RequestMapping("/api/tenants/{tenantId}/hall-availability")
public class HallAvailabilityController {

    private final HallAvailabilityService service;

    public HallAvailabilityController(HallAvailabilityService service) {
        this.service = service;
    }

    @GetMapping
    public List<HallAvailabilityDto> list(
            @PathVariable UUID tenantId,
            @RequestParam(required = false) UUID hallId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.list(tenantId, hallId, from, to);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HallAvailabilityDto create(
            @PathVariable UUID tenantId,
            @RequestParam(required = false) UUID createdBy,
            @Valid @RequestBody HallAvailabilityUpsertRequest request) {
        return service.create(tenantId, createdBy, request);
    }

    @PutMapping("/{id}")
    public HallAvailabilityDto update(
            @PathVariable UUID tenantId,
            @PathVariable UUID id,
            @Valid @RequestBody HallAvailabilityUpsertRequest request) {
        return service.update(tenantId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID tenantId, @PathVariable UUID id) {
        service.delete(tenantId, id);
    }

    /** Surfaces a conflicting block as 409 with the conflict in the body, instead of a generic error. */
    @ExceptionHandler(HallAvailabilityConflictException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(HallAvailabilityConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "message", ex.getMessage(),
                "conflict", ex.getConflict()
        ));
    }
}