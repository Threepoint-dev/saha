package com.saha.setup;

import com.saha.model.QuoteSettings;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class QuoteSettingsService {

    private final QuoteSettingsRepository repository;

    public QuoteSettingsService(QuoteSettingsRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public QuoteSettingsDto get(UUID tenantId) {
        return QuoteSettingsDto.from(getOrCreate(tenantId));
    }

    @Transactional
    public QuoteSettingsDto upsert(UUID tenantId, QuoteSettingsUpsertRequest request) {
        QuoteSettings settings = getOrCreate(tenantId);
        if (request.vatRate() != null) {
            settings.setVatRate(request.vatRate());
        }
        if (request.validityDays() != null) {
            settings.setValidityDays(request.validityDays());
        }
        if (request.quotePrefix() != null) {
            settings.setQuotePrefix(request.quotePrefix());
        }
        settings.setDefaultTerms(request.defaultTerms());
        settings.setFooterText(request.footerText());
        if (request.enablePdfBranding() != null) {
            settings.setEnablePdfBranding(request.enablePdfBranding());
        }
        if (request.allowManualDiscount() != null) {
            settings.setAllowManualDiscount(request.allowManualDiscount());
        }
        settings.setUpdatedAt(OffsetDateTime.now());
        return QuoteSettingsDto.from(repository.save(settings));
    }

    private QuoteSettings getOrCreate(UUID tenantId) {
        return repository.findByTenantId(tenantId).orElseGet(() -> createDefault(tenantId));
    }

    private QuoteSettings createDefault(UUID tenantId) {
        QuoteSettings settings = new QuoteSettings();
        settings.setId(UUID.randomUUID());
        settings.setTenantId(tenantId);
        settings.setVatRate(new BigDecimal("15"));
        settings.setValidityDays(7);
        settings.setQuotePrefix("QT");
        settings.setEnablePdfBranding(Boolean.TRUE);
        settings.setAllowManualDiscount(Boolean.FALSE);
        settings.setUpdatedAt(OffsetDateTime.now());
        return repository.save(settings);
    }
}
