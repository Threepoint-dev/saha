package com.saha.quote;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.UUID;

public record LineItemRequest(
        @NotBlank String itemName,
        String itemType,
        String description,
        Integer quantity,
        BigDecimal unitPrice,
        Boolean isTaxable,
        Integer sortOrder,
        UUID sourceId
) {
}
