package com.saha.repository;

import com.saha.model.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, UUID> {

    List<Inquiry> findByTenantId(UUID tenantId);

    List<Inquiry> findByTenantIdAndStatus(UUID tenantId, String status);

    List<Inquiry> findByOwnerId(UUID ownerId);

    Optional<Inquiry> findByInquiryNumber(String inquiryNumber);
}