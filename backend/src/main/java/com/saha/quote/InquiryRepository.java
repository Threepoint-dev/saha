package com.saha.quote;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InquiryRepository extends JpaRepository<Inquiry, UUID> {

    Optional<Inquiry> findByIdAndTenantId(UUID id, UUID tenantId);
}
