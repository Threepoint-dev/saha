package com.saha.controller;

import com.saha.model.HotelUser;
import com.saha.service.HotelUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class HotelUserController {

    private final HotelUserService hotelUserService;

    @GetMapping
    public ResponseEntity<List<HotelUser>> getAll() {
        return ResponseEntity.ok(hotelUserService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HotelUser> getById(@PathVariable UUID id) {
        return hotelUserService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<HotelUser>> getByTenantId(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(hotelUserService.getByTenantId(tenantId));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<HotelUser> getByEmail(@PathVariable String email) {
        return hotelUserService.getByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<HotelUser> create(@RequestBody HotelUser hotelUser) {
        return ResponseEntity.ok(hotelUserService.create(hotelUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HotelUser> update(@PathVariable UUID id,
                                            @RequestBody HotelUser hotelUser) {
        return ResponseEntity.ok(hotelUserService.update(id, hotelUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        hotelUserService.delete(id);
        return ResponseEntity.noContent().build();
    }
}