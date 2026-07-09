package com.saha.setup;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PackageDto(
        UUID id,
        UUID tenantId,
        String name,
        String description,
        BigDecimal price,
        Boolean isTaxable,
        String status,
        OffsetDateTime createdAt
) {
    public static PackageDto from(EventPackage p) {
        return new PackageDto(
                p.getId(),
                p.getTenantId(),
                p.getName(),
                p.getDescription(),
                p.getPrice(),
                p.getIsTaxable(),
                p.getStatus(),
                p.getCreatedAt()
        );
    }
}
