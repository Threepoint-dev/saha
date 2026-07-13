package com.saha.setup;

import com.saha.model.Hall;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record HallDto(
        UUID id,
        UUID tenantId,
        String name,
        Integer capacity,
        BigDecimal basePrice,
        String defaultSetup,
        String shortCode,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static HallDto from(Hall h) {
        return new HallDto(
                h.getId(),
                h.getTenantId(),
                h.getName(),
                h.getCapacity(),
                h.getBasePrice(),
                h.getDefaultSetup(),
                h.getShortCode(),
                h.getStatus(),
                h.getCreatedAt(),
                h.getUpdatedAt()
        );
    }
}
