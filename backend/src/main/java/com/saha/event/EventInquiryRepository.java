package com.saha.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EventInquiryRepository extends JpaRepository<EventInquiry, UUID> {

    Optional<EventInquiry> findByIdAndTenantId(UUID id, UUID tenantId);
}
