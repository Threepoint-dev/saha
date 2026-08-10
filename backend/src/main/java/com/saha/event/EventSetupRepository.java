package com.saha.event;

import com.saha.model.EventSetup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventSetupRepository extends JpaRepository<EventSetup, UUID> {

    Optional<EventSetup> findByInquiryId(UUID inquiryId);

    boolean existsByInquiryId(UUID inquiryId);

    List<EventSetup> findAllByInquiryIdIn(List<UUID> inquiryIds);
}