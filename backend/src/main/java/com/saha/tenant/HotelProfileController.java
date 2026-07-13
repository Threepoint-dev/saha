package com.saha.tenant;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/tenants/{tenantId}")
public class HotelProfileController {

    private final HotelProfileService service;

    public HotelProfileController(HotelProfileService service) {
        this.service = service;
    }

    @GetMapping("/profile")
    public HotelProfileDto getProfile(@PathVariable UUID tenantId) {
        return service.getProfile(tenantId);
    }

    @PutMapping("/profile")
    public HotelProfileDto updateProfile(
            @PathVariable UUID tenantId,
            @Valid @RequestBody UpdateHotelProfileRequest request) {
        return service.updateProfile(tenantId, request);
    }
}
