package com.saha.event;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Writable view of the existing inquiry table scoped to the fields EP-05 needs:
 * the customer confirmation timestamp and status transition. The quote module
 * keeps its own read-only Inquiry entity; this class never redefines that table's
 * schema, it only maps the columns this feature reads and writes.
 */
@Getter
@Setter
@Entity
@Table(name = "inquiry")
public class EventInquiry {

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

    @Column(name = "customer_confirmed_at")
    private OffsetDateTime customerConfirmedAt;

    @Column(name = "notes")
    private String notes;
}
