package com.saha.quote;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Read-only view of the existing inquiry table. Used to render the inquiry
 * summary on the quote list / builder / preview pages. Never written to here.
 */
@Getter
@Setter
@Entity
@Table(name = "inquiry")
public class Inquiry {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "client_phone")
    private String clientPhone;

    @Column(name = "client_email")
    private String clientEmail;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "guest_count")
    private Integer guestCount;

    @Column(name = "status")
    private String status;
}
