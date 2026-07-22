package com.saha.quote;

import com.saha.model.Quote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuoteRepository extends JpaRepository<Quote, UUID> {

    List<Quote> findAllByTenantIdAndInquiryIdOrderByCreatedAtDesc(UUID tenantId, UUID inquiryId);

    List<Quote> findAllByTenantIdAndInquiryId(UUID tenantId, UUID inquiryId);

    Optional<Quote> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Quote> findByShareLink(String shareLink);

    long countByTenantId(UUID tenantId);

    @Modifying
    @Query("UPDATE Quote q SET q.isCurrent = false, q.updatedAt = :now " +
           "WHERE q.tenantId = :tenantId AND q.inquiryId = :inquiryId AND q.isCurrent = true")
    void clearCurrentFlagForInquiry(@Param("tenantId") UUID tenantId,
                                    @Param("inquiryId") UUID inquiryId,
                                    @Param("now") OffsetDateTime now);
}
