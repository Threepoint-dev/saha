package com.saha.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EventSetupRepository extends JpaRepository<EventSetup, UUID> {

    Optional<EventSetup> findByInquiryId(UUID inquiryId);

    boolean existsByInquiryId(UUID inquiryId);
}
