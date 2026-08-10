package com.saha.event;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Form payload for creating or updating an event setup. Every field is optional
 * so the page can send the whole form on each save; the service applies them as-is.
 */
public record EventSetupRequest(
        UUID quoteId,
        UUID hallId,
        String setupType,
        String layoutNotes,
        String layoutDesign,
        Integer guestCount,
        Integer banquetHeadcount,
        String cateringStyle,
        String mainMeal,
        LocalTime startTime,
        LocalTime endTime,
        Integer durationHours,
        LocalDate eventDate,
        String chairColor,
        String tableColor,
        String agenda,
        String internalNotes,
        String opsNotes,
        String attachmentUrl,
        String preparationStatus
) {
}