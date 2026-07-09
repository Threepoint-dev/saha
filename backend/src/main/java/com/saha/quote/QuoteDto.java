package com.saha.quote;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record QuoteDto(
        UUID id,
        UUID tenantId,
        UUID inquiryId,
        UUID createdBy,
        String quoteNumber,
        String status,
        BigDecimal subtotal,
        BigDecimal vatAmount,
        BigDecimal vatRate,
        BigDecimal total,
        LocalDate issuedDate,
        LocalDate validUntil,
        String notes,
        String shareLink,
        Boolean isCurrent,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<QuoteLineItemDto> lineItems
) {
    public static QuoteDto from(Quote q) {
        return from(q, null);
    }

    public static QuoteDto from(Quote q, List<QuoteLineItemDto> lineItems) {
        return new QuoteDto(
                q.getId(),
                q.getTenantId(),
                q.getInquiryId(),
                q.getCreatedBy(),
                q.getQuoteNumber(),
                q.getStatus(),
                q.getSubtotal(),
                q.getVatAmount(),
                q.getVatRate(),
                q.getTotal(),
                q.getIssuedDate(),
                q.getValidUntil(),
                q.getNotes(),
                q.getShareLink(),
                q.getIsCurrent(),
                q.getCreatedAt(),
                q.getUpdatedAt(),
                lineItems
        );
    }
}
