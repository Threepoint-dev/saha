package com.saha.quote;

import com.saha.model.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuoteRepository extends JpaRepository<Quote, UUID> {

    List<Quote> findAllByTenantIdAndInquiryIdOrderByCreatedAtDesc(UUID tenantId, UUID inquiryId);

    List<Quote> findAllByTenantIdAndInquiryId(UUID tenantId, UUID inquiryId);

    Optional<Quote> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Quote> findByShareLink(String shareLink);

    long countByTenantId(UUID tenantId);
}
