package com.saha.quote;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "quote")
public class Quote {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "inquiry_id", nullable = false)
    private UUID inquiryId;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "quote_number")
    private String quoteNumber;

    @Column(name = "status")
    private String status;

    @Column(name = "subtotal")
    private BigDecimal subtotal;

    @Column(name = "vat_amount")
    private BigDecimal vatAmount;

    @Column(name = "vat_rate")
    private BigDecimal vatRate;

    @Column(name = "total")
    private BigDecimal total;

    @Column(name = "issued_date")
    private LocalDate issuedDate;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "notes")
    private String notes;

    @Column(name = "share_link")
    private String shareLink;

    @Column(name = "is_current")
    private Boolean isCurrent;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
