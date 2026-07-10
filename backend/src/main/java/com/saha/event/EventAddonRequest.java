package com.saha.event;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record EventAddonRequest(
        @NotNull UUID addonId,
        @NotNull @Positive Integer quantity
) {
}
