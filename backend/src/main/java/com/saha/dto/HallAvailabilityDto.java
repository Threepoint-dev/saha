package com.saha.dto;

import com.saha.model.HallAvailability;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

public record HallAvailabilityDto(
        UUID id,
        UUID tenantId,
        UUID hallId,
        String hallName,
        UUID inquiryId,
        UUID createdBy,
        LocalDate eventDate,
        LocalTime startTime,
        LocalTime endTime,
        String status,
        String reason,
        String notes,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static HallAvailabilityDto from(HallAvailability b, String hallName) {
        return new HallAvailabilityDto(
                b.getId(),
                b.getTenantId(),
                b.getHallId(),
                hallName,
                b.getInquiryId(),
                b.getCreatedBy(),
                b.getEventDate(),
                b.getStartTime(),
                b.getEndTime(),
                b.getStatus(),
                b.getReason(),
                b.getNotes(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }
}