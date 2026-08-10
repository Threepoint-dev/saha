package com.saha.event;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Operational-only view of a shared event for the Events Team (EP-08).
 * Deliberately excludes quote pricing, margins, discounts, and negotiation
 * notes — Events Team only sees hall, date, guest count, setup type,
 * catering, add-ons, agenda, and operational notes from Sales.
 */
public record EventsTeamRequestDetailDto(
        UUID inquiryId,
        String clientName,
        String eventType,
        String inquiryStatus,
        LocalDate eventDate,
        LocalTime startTime,
        LocalTime endTime,
        String hallName,
        Integer guestCount,
        String setupType,
        String layoutNotes,
        String layoutDesign,
        String chairColor,
        String tableColor,
        String cateringStyle,
        String mainMeal,
        List<String> addonNames,
        String agenda,
        String opsNotes,
        String preparationStatus,
        OffsetDateTime updatedAt
) {
}