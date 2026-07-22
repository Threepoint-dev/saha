package com.saha.event;

import com.saha.model.EventSetup;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class EventSetupService {

    private static final String STATUS_PENDING = "pending";

    private final EventSetupRepository repository;
    private final EventInquiryRepository inquiryRepository;

    public EventSetupService(EventSetupRepository repository, EventInquiryRepository inquiryRepository) {
        this.repository = repository;
        this.inquiryRepository = inquiryRepository;
    }

    @Transactional(readOnly = true)
    public EventSetupDto get(UUID tenantId, UUID inquiryId) {
        requireInquiry(tenantId, inquiryId);
        EventSetup setup = repository.findByInquiryId(inquiryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event setup not found"));
        return EventSetupDto.from(setup);
    }

    @Transactional
    public EventSetupDto create(UUID tenantId, UUID inquiryId, EventSetupRequest request) {
        requireInquiry(tenantId, inquiryId);
        if (repository.existsByInquiryId(inquiryId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Event setup already exists for this inquiry");
        }

        OffsetDateTime now = OffsetDateTime.now();
        EventSetup setup = new EventSetup();
        setup.setInquiryId(inquiryId);
        applyRequest(setup, request);
        if (setup.getPreparationStatus() == null || setup.getPreparationStatus().isBlank()) {
            setup.setPreparationStatus(STATUS_PENDING);
        }
        setup.setCreatedAt(now);
        setup.setUpdatedAt(now);
        return EventSetupDto.from(repository.save(setup));
    }

    @Transactional
    public EventSetupDto update(UUID tenantId, UUID inquiryId, EventSetupRequest request) {
        requireInquiry(tenantId, inquiryId);
        EventSetup setup = repository.findByInquiryId(inquiryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event setup not found"));
        applyRequest(setup, request);
        setup.setUpdatedAt(OffsetDateTime.now());
        return EventSetupDto.from(repository.save(setup));
    }

    @Transactional
    public void delete(UUID tenantId, UUID inquiryId) {
        requireInquiry(tenantId, inquiryId);
        EventSetup setup = repository.findByInquiryId(inquiryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event setup not found"));
        repository.delete(setup);
    }

    private void applyRequest(EventSetup setup, EventSetupRequest request) {
        setup.setQuoteId(request.quoteId());
        setup.setHallId(request.hallId());
        setup.setSetupType(request.setupType());
        setup.setLayoutNotes(request.layoutNotes());
        setup.setGuestCount(request.guestCount());
        setup.setBanquetHeadcount(request.banquetHeadcount());
        setup.setCateringStyle(request.cateringStyle());
        setup.setMainMeal(request.mainMeal());
        setup.setStartTime(request.startTime());
        setup.setEndTime(request.endTime());
        setup.setDurationHours(request.durationHours());
        setup.setEventDate(request.eventDate());
        setup.setChairColor(request.chairColor());
        setup.setTableColor(request.tableColor());
        setup.setAgenda(request.agenda());
        setup.setInternalNotes(request.internalNotes());
        setup.setOpsNotes(request.opsNotes());
        setup.setAttachmentUrl(request.attachmentUrl());
        if (request.preparationStatus() != null && !request.preparationStatus().isBlank()) {
            setup.setPreparationStatus(request.preparationStatus());
        }
    }

    private void requireInquiry(UUID tenantId, UUID inquiryId) {
        inquiryRepository.findByIdAndTenantId(inquiryId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquiry not found"));
    }
}
