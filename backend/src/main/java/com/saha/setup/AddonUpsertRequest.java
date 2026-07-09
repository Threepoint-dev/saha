package com.saha.setup;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AddonUpsertRequest(
        @NotBlank @Size(max = 255) String name,
        @PositiveOrZero BigDecimal price,
        Boolean isTaxable
) {
}
