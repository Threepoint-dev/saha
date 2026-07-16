package com.saha.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "event_addon")
public class EventAddon {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "event_setup_id", nullable = false, updatable = false)
    private UUID eventSetupId;

    @Column(name = "addon_id", nullable = false)
    private UUID addonId;

    @Column(name = "quantity")
    private Integer quantity;
}
