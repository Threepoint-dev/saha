package com.saha.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "event_setup")
public class EventSetup {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "inquiry_id", nullable = false, updatable = false)
    private UUID inquiryId;

    @Column(name = "quote_id")
    private UUID quoteId;

    @Column(name = "hall_id")
    private UUID hallId;

    @Column(name = "setup_type")
    private String setupType;

    @Column(name = "layout_notes")
    private String layoutNotes;

    @Column(name = "guest_count")
    private Integer guestCount;

    @Column(name = "banquet_headcount")
    private Integer banquetHeadcount;

    @Column(name = "catering_style")
    private String cateringStyle;

    @Column(name = "main_meal")
    private String mainMeal;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "chair_color")
    private String chairColor;

    @Column(name = "table_color")
    private String tableColor;

    @Column(name = "agenda")
    private String agenda;

    @Column(name = "internal_notes")
    private String internalNotes;

    @Column(name = "ops_notes")
    private String opsNotes;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "preparation_status")
    private String preparationStatus;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
