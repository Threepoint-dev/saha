package com.saha.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "quote_settings")
public class QuoteSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false, unique = true)
    private HotelTenant tenant;

    @Column(name = "vat_rate", precision = 5, scale = 2)
    private BigDecimal vatRate = BigDecimal.valueOf(15);

    @Column(name = "quote_prefix")
    private String quotePrefix = "QT-";

    @Column(name = "validity_days")
    private Integer validityDays = 14;

    @Column(name = "default_terms", columnDefinition = "TEXT")
    private String defaultTerms;

    @Column(name = "footer_text", columnDefinition = "TEXT")
    private String footerText;

    @Column(name = "enable_pdf_branding")
    private Boolean enablePdfBranding = true;

    @Column(name = "allow_manual_discount")
    private Boolean allowManualDiscount = false;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}