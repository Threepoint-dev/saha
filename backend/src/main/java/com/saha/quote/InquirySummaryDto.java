package com.saha.quote;

import java.time.LocalDate;
import java.util.UUID;

public record InquirySummaryDto(
        UUID id,
        UUID tenantId,
        String clientName,
        String clientPhone,
        String clientEmail,
        LocalDate eventDate,
        Integer guestCount,
        String status
) {
    public static InquirySummaryDto from(Inquiry i) {
        return new InquirySummaryDto(
                i.getId(),
                i.getTenantId(),
                i.getClientName(),
                i.getClientPhone(),
                i.getClientEmail(),
                i.getEventDate(),
                i.getGuestCount(),
                i.getStatus()
        );
    }
}
