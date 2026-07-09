package com.saha.tenant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class HotelTenantService {

    private final HotelTenantRepository repository;

    public HotelTenantService(HotelTenantRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public HotelProfileDto getProfile(UUID tenantId) {
        HotelTenant tenant = repository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found"));
        return HotelProfileDto.from(tenant);
    }

    @Transactional
    public HotelProfileDto updateProfile(UUID tenantId, UpdateHotelProfileRequest request) {
        HotelTenant tenant = repository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found"));

        tenant.setName(request.name());
        tenant.setAddress(request.address());
        tenant.setCity(request.city());
        tenant.setDistrict(request.district());
        tenant.setPhone(request.phone());
        tenant.setMainContactName(request.mainContactName());
        tenant.setMainContactEmail(request.mainContactEmail());
        tenant.setMainContactPhone(request.mainContactPhone());
        tenant.setLogoUrl(request.logoUrl());
        tenant.setQuoteFooterText(request.quoteFooterText());
        tenant.setTermsNotes(request.termsNotes());
        if (request.isActive() != null) {
            tenant.setIsActive(request.isActive());
        }
        tenant.setUpdatedAt(OffsetDateTime.now());

        return HotelProfileDto.from(repository.save(tenant));
    }
}
