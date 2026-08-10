package com.saha.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventInquiryRepository extends JpaRepository<EventInquiry, UUID> {

    Optional<EventInquiry> findByIdAndTenantId(UUID id, UUID tenantId);

    /** Inquiries whose Final Internal BEO has been shared with the Events Team, most recent first. */
    List<EventInquiry> findAllByTenantIdAndBeoSharedWithEventsTrueOrderByBeoSharedAtDesc(UUID tenantId);

    /** All of a tenant's inquiries — used by the Events Director Dashboard for hall load / trend stats. */
    List<EventInquiry> findAllByTenantId(UUID tenantId);
}