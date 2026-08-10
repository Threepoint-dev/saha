package com.saha.setup;

import com.saha.model.SourceChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SourceChannelRepository extends JpaRepository<SourceChannel, UUID> {

    List<SourceChannel> findByTenantId(UUID tenantId);

    List<SourceChannel> findAllByTenantIdOrderBySortOrderAscCreatedAtAsc(UUID tenantId);

    Optional<SourceChannel> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantId(UUID tenantId);

    boolean existsByTenantIdAndIsActiveTrue(UUID tenantId);
}