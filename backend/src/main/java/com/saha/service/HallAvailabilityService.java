package com.saha.service;

import com.saha.dto.HallAvailabilityDto;
import com.saha.dto.HallAvailabilityUpsertRequest;
import com.saha.model.Hall;
import com.saha.model.HallAvailability;
import com.saha.repository.HallAvailabilityRepository;
import com.saha.setup.HallRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Manages the internal hall availability calendar (EP-07). Hotels use this
 * to see whether a hall is free before quoting it, and to block dates for
 * tentative holds, confirmed events, maintenance, or other internal reasons.
 *
 * A hall with no block on a given date is implicitly "Available" — only
 * non-available states (tentative, confirmed, blocked, maintenance) are
 * stored as rows here.
 */
@Service
public class HallAvailabilityService {

    public static final String STATUS_TENTATIVE = "tentative";
    public static final String STATUS_CONFIRMED = "confirmed";
    public static final String STATUS_BLOCKED = "blocked";
    public static final String STATUS_MAINTENANCE = "maintenance";

    private static final List<String> VALID_STATUSES =
            List.of(STATUS_TENTATIVE, STATUS_CONFIRMED, STATUS_BLOCKED, STATUS_MAINTENANCE);

    private final HallAvailabilityRepository repository;
    private final HallRepository hallRepository;

    public HallAvailabilityService(HallAvailabilityRepository repository, HallRepository hallRepository) {
        this.repository = repository;
        this.hallRepository = hallRepository;
    }

    @Transactional(readOnly = true)
    public List<HallAvailabilityDto> list(UUID tenantId, UUID hallId, LocalDate from, LocalDate to) {
        List<HallAvailability> blocks = hallId != null
                ? repository.findAllByTenantIdAndHallIdAndEventDateBetweenOrderByEventDateAsc(tenantId, hallId, from, to)
                : repository.findAllByTenantIdAndEventDateBetweenOrderByEventDateAsc(tenantId, from, to);
        Map<UUID, String> hallNames = loadHallNames(tenantId, blocks);
        return blocks.stream()
                .map(b -> HallAvailabilityDto.from(b, hallNames.get(b.getHallId())))
                .toList();
    }

    @Transactional
    public HallAvailabilityDto create(UUID tenantId, UUID createdBy, HallAvailabilityUpsertRequest request) {
        validateStatus(request.status());
        requireHall(tenantId, request.hallId());

        checkConflict(tenantId, request.hallId(), request.eventDate(),
                request.startTime(), request.endTime(), null, request.force());

        HallAvailability block = new HallAvailability();
        block.setTenantId(tenantId);
        block.setCreatedBy(createdBy);
        applyRequest(block, request);
        HallAvailability saved = repository.save(block);
        return HallAvailabilityDto.from(saved, hallName(tenantId, saved.getHallId()));
    }

    @Transactional
    public HallAvailabilityDto update(UUID tenantId, UUID id, HallAvailabilityUpsertRequest request) {
        validateStatus(request.status());
        requireHall(tenantId, request.hallId());
        HallAvailability block = requireOwned(tenantId, id);

        checkConflict(tenantId, request.hallId(), request.eventDate(),
                request.startTime(), request.endTime(), id, request.force());

        applyRequest(block, request);
        HallAvailability saved = repository.save(block);
        return HallAvailabilityDto.from(saved, hallName(tenantId, saved.getHallId()));
    }

    @Transactional
    public void delete(UUID tenantId, UUID id) {
        HallAvailability block = requireOwned(tenantId, id);
        repository.delete(block);
    }

    /**
     * Marks the hall block for an inquiry as Confirmed (called when the
     * inquiry is marked Won). No-op if there is no block for this inquiry.
     */
    @Transactional
    public void confirmForInquiry(UUID tenantId, UUID inquiryId) {
        repository.findAllByTenantIdAndInquiryId(tenantId, inquiryId)
                .forEach(b -> {
                    b.setStatus(STATUS_CONFIRMED);
                    repository.save(b);
                });
    }

    /**
     * Keeps a Tentative hold on the calendar in sync with an inquiry's Event
     * Setup (US-027) — called automatically whenever Sales saves Event Setup
     * with a hall and date chosen, so the hall shows as held while the
     * customer confirmation is pending, without Sales having to remember to
     * add a block by hand. Skips conflict checking (a soft hold shouldn't
     * block Sales from saving their work) and never touches a block that has
     * already moved past Tentative (e.g. Confirmed after Won).
     */
    @Transactional
    public void upsertTentativeHoldForInquiry(UUID tenantId, UUID inquiryId, UUID hallId,
                                              LocalDate eventDate, LocalTime startTime, LocalTime endTime) {
        List<HallAvailability> existing = repository.findAllByTenantIdAndInquiryId(tenantId, inquiryId);

        if (hallId == null || eventDate == null) {
            // No valid hall/date to hold yet — clear any earlier tentative hold for this inquiry.
            existing.stream()
                    .filter(b -> STATUS_TENTATIVE.equals(b.getStatus()))
                    .forEach(repository::delete);
            return;
        }

        boolean hasNonTentative = existing.stream().anyMatch(b -> !STATUS_TENTATIVE.equals(b.getStatus()));
        if (hasNonTentative) {
            // Already Confirmed/Blocked/Maintenance — leave it to the calendar page, not this automatic sync.
            return;
        }

        HallAvailability block = existing.stream()
                .filter(b -> STATUS_TENTATIVE.equals(b.getStatus()))
                .findFirst()
                .orElseGet(() -> {
                    HallAvailability fresh = new HallAvailability();
                    fresh.setTenantId(tenantId);
                    fresh.setInquiryId(inquiryId);
                    fresh.setStatus(STATUS_TENTATIVE);
                    fresh.setReason("Auto-created from Event Setup");
                    return fresh;
                });

        block.setHallId(hallId);
        block.setEventDate(eventDate);
        block.setStartTime(startTime);
        block.setEndTime(endTime);
        repository.save(block);
    }

    private void applyRequest(HallAvailability block, HallAvailabilityUpsertRequest request) {
        block.setHallId(request.hallId());
        block.setEventDate(request.eventDate());
        block.setStartTime(request.startTime());
        block.setEndTime(request.endTime());
        block.setStatus(request.status());
        block.setInquiryId(request.inquiryId());
        block.setReason(request.reason());
        block.setNotes(request.notes());
    }

    private void checkConflict(UUID tenantId, UUID hallId, LocalDate eventDate,
                               LocalTime startTime, LocalTime endTime, UUID excludeId, boolean force) {
        if (force) {
            return;
        }
        List<HallAvailability> sameDay = excludeId != null
                ? repository.findAllByTenantIdAndHallIdAndEventDateAndIdNot(tenantId, hallId, eventDate, excludeId)
                : repository.findAllByTenantIdAndHallIdAndEventDate(tenantId, hallId, eventDate);

        sameDay.stream()
                .filter(existing -> overlaps(startTime, endTime, existing.getStartTime(), existing.getEndTime()))
                .findFirst()
                .ifPresent(existing -> {
                    throw new HallAvailabilityConflictException(
                            HallAvailabilityDto.from(existing, hallName(tenantId, existing.getHallId())));
                });
    }

    /** Two time ranges overlap; a missing start/end time is treated as covering the whole day. */
    private boolean overlaps(LocalTime aStart, LocalTime aEnd, LocalTime bStart, LocalTime bEnd) {
        LocalTime s1 = aStart != null ? aStart : LocalTime.MIN;
        LocalTime e1 = aEnd != null ? aEnd : LocalTime.MAX;
        LocalTime s2 = bStart != null ? bStart : LocalTime.MIN;
        LocalTime e2 = bEnd != null ? bEnd : LocalTime.MAX;
        return s1.isBefore(e2) && s2.isBefore(e1);
    }

    private void validateStatus(String status) {
        if (status == null || !VALID_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status must be one of: " + String.join(", ", VALID_STATUSES));
        }
    }

    private Hall requireHall(UUID tenantId, UUID hallId) {
        return hallRepository.findByIdAndTenantId(hallId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hall not found"));
    }

    private HallAvailability requireOwned(UUID tenantId, UUID id) {
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Availability block not found"));
    }

    private String hallName(UUID tenantId, UUID hallId) {
        return hallRepository.findByIdAndTenantId(hallId, tenantId).map(Hall::getName).orElse(null);
    }

    private Map<UUID, String> loadHallNames(UUID tenantId, List<HallAvailability> blocks) {
        return blocks.stream()
                .map(HallAvailability::getHallId)
                .distinct()
                .map(id -> hallRepository.findByIdAndTenantId(id, tenantId).orElse(null))
                .filter(h -> h != null)
                .collect(Collectors.toMap(Hall::getId, Function.identity()))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getName()));
    }
}