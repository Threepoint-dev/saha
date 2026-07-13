package com.saha.setup;

import com.saha.model.QuoteSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface QuoteSettingsRepository extends JpaRepository<QuoteSettings, UUID> {

    Optional<QuoteSettings> findByTenantId(UUID tenantId);

    boolean existsByTenantId(UUID tenantId);
}
