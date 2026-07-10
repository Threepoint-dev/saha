package com.saha.tenant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "hotel_tenant")
public class HotelTenant {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "district")
    private String district;

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

    @Column(name = "quote_footer_text")
    private String quoteFooterText;

    @Column(name = "terms_notes")
    private String termsNotes;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "readiness_status")
    private String readinessStatus;

    @Column(name = "pilot_status")
    private String pilotStatus;

    @Column(name = "pilot_start_date")
    private LocalDate pilotStartDate;

    @Column(name = "baseline_duration")
    private Integer baselineDuration;

    @Column(name = "data_quality_score")
    private Integer dataQualityScore;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
