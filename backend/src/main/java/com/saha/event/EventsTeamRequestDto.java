package com.saha.event;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/** One row in the Events Team Request Tracker (EP-08). */
public record EventsTeamRequestDto(
        UUID inquiryId,
        String clientName,
        String eventType,
        LocalDate eventDate,
        String hallName,
        Integer guestCount,
        String setupType,
        String preparationStatus,
        String ownerName,
        OffsetDateTime updatedAt
) {
}