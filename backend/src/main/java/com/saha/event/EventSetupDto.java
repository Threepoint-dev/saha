package com.saha.event;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

public record EventSetupDto(
        UUID id,
        UUID inquiryId,
        UUID quoteId,
        UUID hallId,
        String setupType,
        String layoutNotes,
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
        String preparationStatus,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static EventSetupDto from(EventSetup s) {
        return new EventSetupDto(
                s.getId(),
                s.getInquiryId(),
                s.getQuoteId(),
                s.getHallId(),
                s.getSetupType(),
                s.getLayoutNotes(),
                s.getGuestCount(),
                s.getBanquetHeadcount(),
                s.getCateringStyle(),
                s.getMainMeal(),
                s.getStartTime(),
                s.getEndTime(),
                s.getDurationHours(),
                s.getEventDate(),
                s.getChairColor(),
                s.getTableColor(),
                s.getAgenda(),
                s.getInternalNotes(),
                s.getOpsNotes(),
                s.getAttachmentUrl(),
                s.getPreparationStatus(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
