package com.saha.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "event_setup")
public class EventSetup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquiry_id", nullable = false)
    private Inquiry inquiry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id")
    private Quote quote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hall_id")
    private Hall hall;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Column(name = "guest_count")
    private Integer guestCount;

    @Column(name = "setup_type")
    private String setupType;

    @Column(name = "table_color")
    private String tableColor;

    @Column(name = "chair_color")
    private String chairColor;

    @Column(name = "layout_notes", columnDefinition = "TEXT")
    private String layoutNotes;

    @Column(name = "catering_style")
    private String cateringStyle;

    @Column(name = "main_meal")
    private String mainMeal;

    @Column(name = "banquet_headcount")
    private Integer banquetHeadcount;

    @Column(name = "agenda", columnDefinition = "TEXT")
    private String agenda;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "preparation_status")
    private String preparationStatus = "NEW";

    @Column(name = "ops_notes", columnDefinition = "TEXT")
    private String opsNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}