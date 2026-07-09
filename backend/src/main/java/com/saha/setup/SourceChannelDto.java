package com.saha.setup;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SourceChannelDto(
        UUID id,
        UUID tenantId,
        String name,
        Boolean isActive,
        Integer sortOrder,
        OffsetDateTime createdAt
) {
    public static SourceChannelDto from(SourceChannel c) {
        return new SourceChannelDto(
                c.getId(),
                c.getTenantId(),
                c.getName(),
                c.getIsActive(),
                c.getSortOrder(),
                c.getCreatedAt()
        );
    }
}
