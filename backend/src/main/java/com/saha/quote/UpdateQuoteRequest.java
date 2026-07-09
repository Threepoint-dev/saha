package com.saha.quote;

public record UpdateQuoteRequest(
        String notes,
        String status
) {
}
