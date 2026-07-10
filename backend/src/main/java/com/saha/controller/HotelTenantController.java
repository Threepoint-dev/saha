package com.saha.controller;

import com.saha.model.HotelTenant;
import com.saha.service.HotelTenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class HotelTenantController {

    private final HotelTenantService hotelTenantService;

    @GetMapping
    public ResponseEntity<List<HotelTenant>> getAll() {
        return ResponseEntity.ok(hotelTenantService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HotelTenant> getById(@PathVariable UUID id) {
        return hotelTenantService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<HotelTenant> create(@RequestBody HotelTenant hotelTenant) {
        return ResponseEntity.ok(hotelTenantService.create(hotelTenant));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HotelTenant> update(@PathVariable UUID id,
                                              @RequestBody HotelTenant hotelTenant) {
        return ResponseEntity.ok(hotelTenantService.update(id, hotelTenant));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        hotelTenantService.delete(id);
        return ResponseEntity.noContent().build();
    }
}