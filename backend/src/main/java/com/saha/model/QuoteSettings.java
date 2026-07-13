package com.saha.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "quote_settings")
public class QuoteSettings {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    @Column(name = "vat_rate")
    private BigDecimal vatRate;

    @Column(name = "validity_days")
    private Integer validityDays;

    @Column(name = "quote_prefix")
    private String quotePrefix;

    @Column(name = "default_terms")
    private String defaultTerms;

    @Column(name = "footer_text")
    private String footerText;

    @Column(name = "enable_pdf_branding")
    private Boolean enablePdfBranding;

    @Column(name = "allow_manual_discount")
    private Boolean allowManualDiscount;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
