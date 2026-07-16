package com.saha.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "inquiry")
public class Inquiry {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "source_channel_id")
    private UUID sourceChannelId;

    @Column(name = "hall_id")
    private UUID hallId;

    @Column(name = "inquiry_number")
    private String inquiryNumber;

    @Column(name = "client_name", nullable = false)
    private String clientName;

    @Column(name = "client_email")
    private String clientEmail;

    @Column(name = "client_phone")
    private String clientPhone;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "event_date_to")
    private LocalDate eventDateTo;

    @Column(name = "guest_count")
    private Integer guestCount;

    @Column(name = "estimated_value", precision = 10, scale = 2)
    private BigDecimal estimatedValue;

    @Column(name = "priority")
    private String priority;

    @Column(name = "status")
    private String status = "NEW";

    @Column(name = "loss_reason")
    private String lossReason;

    @Column(name = "loss_note", columnDefinition = "TEXT")
    private String lossNote;

    @Column(name = "first_response_at")
    private OffsetDateTime firstResponseAt;

    @Column(name = "customer_confirmed_at")
    private OffsetDateTime customerConfirmedAt;

    @Column(name = "beo_shared_at")
    private OffsetDateTime beoSharedAt;

    @Column(name = "beo_shared_with_events")
    private Boolean beoSharedWithEvents = false;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}