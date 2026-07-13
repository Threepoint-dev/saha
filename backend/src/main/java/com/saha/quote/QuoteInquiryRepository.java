package com.saha.quote;

import com.saha.model.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface QuoteInquiryRepository extends JpaRepository<Inquiry, UUID> {

    Optional<Inquiry> findByIdAndTenantId(UUID id, UUID tenantId);
}
