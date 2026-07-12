package com.saha.repository;

import com.saha.model.InquiryStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface InquiryStatusLogRepository extends JpaRepository<InquiryStatusLog, UUID> {

    List<InquiryStatusLog> findByInquiryId(UUID inquiryId);
}