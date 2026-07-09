package com.saha.setup;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record HallUpsertRequest(
        @NotBlank @Size(max = 255) String name,
        @PositiveOrZero Integer capacity,
        @PositiveOrZero BigDecimal basePrice,
        @Size(max = 255) String defaultSetup,
        @Size(max = 32) String shortCode
) {
}
