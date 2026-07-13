package com.saha.service;

import com.saha.model.Inquiry;
import com.saha.model.InquiryStatusLog;
import com.saha.repository.InquiryRepository;
import com.saha.repository.InquiryStatusLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final InquiryStatusLogRepository inquiryStatusLogRepository;

    public List<Inquiry> getAll() {
        return inquiryRepository.findAll();
    }

    public List<Inquiry> getByTenantId(UUID tenantId) {
        return inquiryRepository.findByTenantId(tenantId);
    }

    public List<Inquiry> getByTenantIdAndStatus(UUID tenantId, String status) {
        return inquiryRepository.findByTenantIdAndStatus(tenantId, status);
    }

    public List<Inquiry> getByOwnerId(UUID ownerId) {
        return inquiryRepository.findByOwnerId(ownerId);
    }

    public Optional<Inquiry> getById(UUID id) {
        return inquiryRepository.findById(id);
    }

    public Inquiry create(Inquiry inquiry) {
        inquiry.setStatus("NEW");
        inquiry.setInquiryNumber(generateInquiryNumber());
        return inquiryRepository.save(inquiry);
    }

    public Inquiry update(UUID id, Inquiry updated) {
        Inquiry existing = inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inquiry not found"));

        existing.setClientName(updated.getClientName());
        existing.setClientEmail(updated.getClientEmail());
        existing.setClientPhone(updated.getClientPhone());
        existing.setEventType(updated.getEventType());
        existing.setEventDate(updated.getEventDate());
        existing.setEventDateTo(updated.getEventDateTo());
        existing.setGuestCount(updated.getGuestCount());
        existing.setEstimatedValue(updated.getEstimatedValue());
        existing.setPriority(updated.getPriority());
        existing.setNotes(updated.getNotes());
        existing.setOwnerId(updated.getOwnerId());
        existing.setSourceChannelId(updated.getSourceChannelId());
        existing.setHallId(updated.getHallId());

        return inquiryRepository.save(existing);
    }

    public Inquiry updateStatus(UUID id, String newStatus, UUID changedById) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inquiry not found"));

        String oldStatus = inquiry.getStatus();

        if ("NEW".equals(oldStatus) && !newStatus.equals("NEW")
                && inquiry.getFirstResponseAt() == null) {
            inquiry.setFirstResponseAt(OffsetDateTime.now());
        }

        inquiry.setStatus(newStatus);
        inquiryRepository.save(inquiry);

        InquiryStatusLog log = new InquiryStatusLog();
        log.setInquiryId(inquiry.getId());
        log.setChangedById(changedById);
        log.setFromStatus(oldStatus);
        log.setToStatus(newStatus);
        inquiryStatusLogRepository.save(log);

        return inquiry;
    }

    public Inquiry markLost(UUID id, String lossReason, String lossNote) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inquiry not found"));

        inquiry.setStatus("LOST");
        inquiry.setLossReason(lossReason);
        inquiry.setLossNote(lossNote);

        return inquiryRepository.save(inquiry);
    }

    public void delete(UUID id) {
        inquiryRepository.deleteById(id);
    }

    private String generateInquiryNumber() {
        long count = inquiryRepository.count() + 1;
        return String.format("INQ-%04d", count);
    }
}