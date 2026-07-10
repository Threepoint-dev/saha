package com.saha.event;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record EventAddonQuantityRequest(
        @NotNull @Positive Integer quantity
) {
}
