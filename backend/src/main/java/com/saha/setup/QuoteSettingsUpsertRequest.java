package com.saha.setup;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record QuoteSettingsUpsertRequest(
        @PositiveOrZero @DecimalMax("100.0") BigDecimal vatRate,
        @PositiveOrZero Integer validityDays,
        @Size(max = 255) String quotePrefix,
        String defaultTerms,
        String footerText,
        Boolean enablePdfBranding,
        Boolean allowManualDiscount
) {
}
