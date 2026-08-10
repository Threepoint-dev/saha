package com.saha.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Form payload for creating or updating a hall availability block
 * (tentative hold, confirmed event, maintenance block, etc).
 */
public record HallAvailabilityUpsertRequest(
        @NotNull UUID hallId,
        @NotNull LocalDate eventDate,
        LocalTime startTime,
        LocalTime endTime,
        @NotNull String status,
        UUID inquiryId,
        String reason,
        String notes,
        /** When true, save even if it overlaps an existing block (used for "create tentative waitlist hold"). */
        boolean force
) {
}