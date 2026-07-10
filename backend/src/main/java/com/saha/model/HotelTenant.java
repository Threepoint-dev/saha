package com.saha.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "hotel_tenant")
public class HotelTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "city")
    private String city;

    @Column(name = "district")
    private String district;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "phone")
    private String phone;

    @Column(name = "main_contact_name")
    private String mainContactName;

    @Column(name = "main_contact_email")
    private String mainContactEmail;

    @Column(name = "main_contact_phone")
    private String mainContactPhone;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "pilot_start_date")
    private LocalDate pilotStartDate;

    @Column(name = "baseline_duration")
    private Integer baselineDuration;

    @Column(name = "pilot_status")
    private String pilotStatus;

    @Column(name = "readiness_status")
    private String readinessStatus;

    @Column(name = "data_quality_score")
    private Integer dataQualityScore = 0;

    @Column(name = "quote_footer_text", columnDefinition = "TEXT")
    private String quoteFooterText;

    @Column(name = "terms_notes", columnDefinition = "TEXT")
    private String termsNotes;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}