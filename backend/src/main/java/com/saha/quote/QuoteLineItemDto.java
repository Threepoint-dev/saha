package com.saha.quote;

import com.saha.model.QuoteLineItem;

import java.math.BigDecimal;
import java.util.UUID;

public record QuoteLineItemDto(
        UUID id,
        UUID quoteId,
        String itemName,
        String itemType,
        String description,
        Integer quantity,
        BigDecimal unitPrice,
        Boolean isTaxable,
        BigDecimal total,
        Integer sortOrder
) {
    public static QuoteLineItemDto from(QuoteLineItem i) {
        return new QuoteLineItemDto(
                i.getId(),
                i.getQuoteId(),
                i.getItemName(),
                i.getItemType(),
                i.getDescription(),
                i.getQuantity(),
                i.getUnitPrice(),
                i.getIsTaxable(),
                i.getTotal(),
                i.getSortOrder()
        );
    }
}
