package com.saha.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "inquiry")
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private HotelTenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private HotelUser owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_channel_id")
    private SourceChannel sourceChannel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hall_id")
    private Hall hall;

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