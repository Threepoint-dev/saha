package com.saha.setup;

import com.saha.model.Addon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AddonRepository extends JpaRepository<Addon, UUID> {
    List<Addon> findAllByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    Optional<Addon> findByIdAndTenantId(UUID id, UUID tenantId);
}
