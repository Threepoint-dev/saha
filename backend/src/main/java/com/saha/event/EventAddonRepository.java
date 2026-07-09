package com.saha.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventAddonRepository extends JpaRepository<EventAddon, UUID> {

    List<EventAddon> findAllByEventSetupId(UUID eventSetupId);

    Optional<EventAddon> findByIdAndEventSetupId(UUID id, UUID eventSetupId);
}
