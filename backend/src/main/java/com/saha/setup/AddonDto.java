package com.saha.setup;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AddonDto(
        UUID id,
        UUID tenantId,
        String name,
        BigDecimal price,
        Boolean isTaxable,
        String status,
        OffsetDateTime createdAt
) {
    public static AddonDto from(Addon a) {
        return new AddonDto(
                a.getId(),
                a.getTenantId(),
                a.getName(),
                a.getPrice(),
                a.getIsTaxable(),
                a.getStatus(),
                a.getCreatedAt()
        );
    }
}
