package com.saha.repository;

import com.saha.model.HallAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HallAvailabilityRepository extends JpaRepository<HallAvailability, UUID> {

    List<HallAvailability> findAllByTenantIdAndEventDateBetweenOrderByEventDateAsc(
            UUID tenantId, LocalDate from, LocalDate to);

    List<HallAvailability> findAllByTenantIdAndHallIdAndEventDateBetweenOrderByEventDateAsc(
            UUID tenantId, UUID hallId, LocalDate from, LocalDate to);

    Optional<HallAvailability> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Blocks that occupy the same hall and date as the one being checked,
     * excluding a given block id (used when editing an existing block so it
     * doesn't conflict with itself).
     */
    List<HallAvailability> findAllByTenantIdAndHallIdAndEventDateAndIdNot(
            UUID tenantId, UUID hallId, LocalDate eventDate, UUID excludeId);

    List<HallAvailability> findAllByTenantIdAndHallIdAndEventDate(
            UUID tenantId, UUID hallId, LocalDate eventDate);

    List<HallAvailability> findAllByTenantIdAndInquiryId(UUID tenantId, UUID inquiryId);
}