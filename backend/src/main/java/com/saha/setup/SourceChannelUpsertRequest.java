package com.saha.setup;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record SourceChannelUpsertRequest(
        @NotBlank @Size(max = 255) String name,
        Boolean isActive,
        @PositiveOrZero Integer sortOrder
) {
}
