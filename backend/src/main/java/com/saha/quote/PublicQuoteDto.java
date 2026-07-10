package com.saha.quote;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PublicQuoteDto(
        String quoteNumber,
        String status,
        BigDecimal subtotal,
        BigDecimal vatAmount,
        BigDecimal vatRate,
        BigDecimal total,
        LocalDate issuedDate,
        LocalDate validUntil,
        String notes,
        List<QuoteLineItemDto> lineItems,
        Hotel hotel,
        Client client
) {
    public record Hotel(
            String name,
            String logoUrl,
            String city,
            String district,
            String phone,
            String quoteFooterText,
            String termsNotes
    ) {
    }

    public record Client(
            String clientName,
            LocalDate eventDate,
            Integer guestCount
    ) {
    }
}
