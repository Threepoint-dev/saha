package com.saha.setup;

import com.saha.model.EventPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventPackageRepository extends JpaRepository<EventPackage, UUID> {
    List<EventPackage> findAllByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    Optional<EventPackage> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndStatus(UUID tenantId, String status);
}
