package com.saha.service;

import com.saha.model.HotelTenant;
import com.saha.repository.HotelTenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HotelTenantService {

    private final HotelTenantRepository hotelTenantRepository;

    public List<HotelTenant> getAll() {
        return hotelTenantRepository.findAll();
    }

    public Optional<HotelTenant> getById(UUID id) {
        return hotelTenantRepository.findById(id);
    }

    public HotelTenant create(HotelTenant hotelTenant) {
        return hotelTenantRepository.save(hotelTenant);
    }

    public HotelTenant update(UUID id, HotelTenant updated) {
        HotelTenant existing = hotelTenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hotel tenant not found"));

        existing.setName(updated.getName());
        existing.setCity(updated.getCity());
        existing.setDistrict(updated.getDistrict());
        existing.setAddress(updated.getAddress());
        existing.setPhone(updated.getPhone());
        existing.setMainContactName(updated.getMainContactName());
        existing.setMainContactEmail(updated.getMainContactEmail());
        existing.setMainContactPhone(updated.getMainContactPhone());
        existing.setLogoUrl(updated.getLogoUrl());
        existing.setPilotStartDate(updated.getPilotStartDate());
        existing.setBaselineDuration(updated.getBaselineDuration());
        existing.setPilotStatus(updated.getPilotStatus());
        existing.setReadinessStatus(updated.getReadinessStatus());
        existing.setDataQualityScore(updated.getDataQualityScore());
        existing.setQuoteFooterText(updated.getQuoteFooterText());
        existing.setTermsNotes(updated.getTermsNotes());
        existing.setIsActive(updated.getIsActive());

        return hotelTenantRepository.save(existing);
    }

    public void delete(UUID id) {
        hotelTenantRepository.deleteById(id);
    }
}