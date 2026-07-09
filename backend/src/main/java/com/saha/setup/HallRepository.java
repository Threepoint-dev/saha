package com.saha.setup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HallRepository extends JpaRepository<Hall, UUID> {
    List<Hall> findAllByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    Optional<Hall> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndStatus(UUID tenantId, String status);
}
