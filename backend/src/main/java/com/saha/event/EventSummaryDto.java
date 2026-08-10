package com.saha.event;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Public, unauthenticated customer-facing summary of a confirmed event. Only
 * customer-safe fields are exposed here — internal notes and ops notes are never
 * included.
 */
public record EventSummaryDto(
        Hotel hotel,
        String clientName,
        LocalDate eventDate,
        String hallName,
        String setupType,
        String layoutDesign,
        Integer guestCount,
        String cateringStyle,
        String mainMeal,
        String startTime,
        String endTime,
        String status,
        boolean confirmed,
        List<Addon> addons,
        BigDecimal quoteTotal
) {
    public record Hotel(
            String name,
            String logoUrl,
            String city,
            String district,
            String phone
    ) {
    }

    public record Addon(
            String name,
            Integer quantity
    ) {
    }
}