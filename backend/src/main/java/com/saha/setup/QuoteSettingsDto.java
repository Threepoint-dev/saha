package com.saha.setup;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record QuoteSettingsDto(
        UUID id,
        UUID tenantId,
        BigDecimal vatRate,
        Integer validityDays,
        String quotePrefix,
        String defaultTerms,
        String footerText,
        Boolean enablePdfBranding,
        Boolean allowManualDiscount,
        OffsetDateTime updatedAt
) {
    public static QuoteSettingsDto from(QuoteSettings s) {
        return new QuoteSettingsDto(
                s.getId(),
                s.getTenantId(),
                s.getVatRate(),
                s.getValidityDays(),
                s.getQuotePrefix(),
                s.getDefaultTerms(),
                s.getFooterText(),
                s.getEnablePdfBranding(),
                s.getAllowManualDiscount(),
                s.getUpdatedAt()
        );
    }
}
