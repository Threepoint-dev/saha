package com.saha.tenant;

import com.saha.model.HotelTenant;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record HotelProfileDto(
        UUID id,
        String name,
        String address,
        String city,
        String district,
        String phone,
        String mainContactName,
        String mainContactEmail,
        String mainContactPhone,
        String logoUrl,
        String quoteFooterText,
        String termsNotes,
        Boolean isActive,
        String readinessStatus,
        String pilotStatus,
        LocalDate pilotStartDate,
        Integer baselineDuration,
        Integer dataQualityScore,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static HotelProfileDto from(HotelTenant t) {
        return new HotelProfileDto(
                t.getId(),
                t.getName(),
                t.getAddress(),
                t.getCity(),
                t.getDistrict(),
                t.getPhone(),
                t.getMainContactName(),
                t.getMainContactEmail(),
                t.getMainContactPhone(),
                t.getLogoUrl(),
                t.getQuoteFooterText(),
                t.getTermsNotes(),
                t.getIsActive(),
                t.getReadinessStatus(),
                t.getPilotStatus(),
                t.getPilotStartDate(),
                t.getBaselineDuration(),
                t.getDataQualityScore(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
