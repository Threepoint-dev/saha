package com.saha.event;

import com.saha.model.Addon;
import com.saha.model.EventAddon;
import com.saha.model.EventSetup;
import com.saha.model.Hall;
import com.saha.model.HotelUser;
import com.saha.repository.HotelUserRepository;
import com.saha.setup.AddonRepository;
import com.saha.setup.HallRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Events Team Request Tracker & Detail (EP-08). Shows only inquiries whose
 * Final Internal BEO has been shared by Sales after the deal is Won — an
 * inquiry never appears here before that, and there is no approval or
 * rejection step, only preparation tracking.
 */
@Service
public class EventsTeamService {

    private final EventInquiryRepository inquiryRepository;
    private final EventSetupRepository setupRepository;
    private final EventAddonRepository addonLineRepository;
    private final AddonRepository addonRepository;
    private final HallRepository hallRepository;
    private final HotelUserRepository hotelUserRepository;

    public EventsTeamService(EventInquiryRepository inquiryRepository,
                             EventSetupRepository setupRepository,
                             EventAddonRepository addonLineRepository,
                             AddonRepository addonRepository,
                             HallRepository hallRepository,
                             HotelUserRepository hotelUserRepository) {
        this.inquiryRepository = inquiryRepository;
        this.setupRepository = setupRepository;
        this.addonLineRepository = addonLineRepository;
        this.addonRepository = addonRepository;
        this.hallRepository = hallRepository;
        this.hotelUserRepository = hotelUserRepository;
    }

    @Transactional(readOnly = true)
    public List<EventsTeamRequestDto> listRequests(UUID tenantId) {
        List<EventInquiry> inquiries = inquiryRepository
                .findAllByTenantIdAndBeoSharedWithEventsTrueOrderByBeoSharedAtDesc(tenantId);
        if (inquiries.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = inquiries.stream().map(EventInquiry::getId).toList();
        Map<UUID, EventSetup> setups = setupRepository.findAllByInquiryIdIn(ids).stream()
                .collect(Collectors.toMap(EventSetup::getInquiryId, Function.identity()));
        return inquiries.stream()
                .map(inquiry -> toRequestDto(tenantId, inquiry, setups.get(inquiry.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public EventsTeamRequestDetailDto getDetail(UUID tenantId, UUID inquiryId) {
        EventInquiry inquiry = requireShared(tenantId, inquiryId);
        EventSetup setup = setupRepository.findByInquiryId(inquiryId).orElse(null);

        String hallName = setup != null && setup.getHallId() != null
                ? hallName(tenantId, setup.getHallId()) : null;
        List<String> addonNames = setup != null ? addonNames(tenantId, setup.getId()) : List.of();

        return new EventsTeamRequestDetailDto(
                inquiry.getId(),
                inquiry.getClientName(),
                inquiry.getEventType(),
                inquiry.getStatus(),
                setup != null && setup.getEventDate() != null ? setup.getEventDate() : inquiry.getEventDate(),
                setup != null ? setup.getStartTime() : null,
                setup != null ? setup.getEndTime() : null,
                hallName,
                setup != null && setup.getGuestCount() != null ? setup.getGuestCount() : inquiry.getGuestCount(),
                setup != null ? setup.getSetupType() : null,
                setup != null ? setup.getLayoutNotes() : null,
                setup != null ? setup.getLayoutDesign() : null,
                setup != null ? setup.getChairColor() : null,
                setup != null ? setup.getTableColor() : null,
                setup != null ? setup.getCateringStyle() : null,
                setup != null ? setup.getMainMeal() : null,
                addonNames,
                setup != null ? setup.getAgenda() : null,
                setup != null ? setup.getOpsNotes() : null,
                setup != null && setup.getPreparationStatus() != null ? setup.getPreparationStatus() : "new",
                setup != null ? setup.getUpdatedAt() : inquiry.getBeoSharedAt()
        );
    }

    @Transactional
    public EventsTeamRequestDto updatePreparationStatus(UUID tenantId, UUID inquiryId,
                                                        PreparationStatusUpdateRequest request) {
        EventInquiry inquiry = requireShared(tenantId, inquiryId);
        EventSetup setup = setupRepository.findByInquiryId(inquiryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event setup not found"));
        setup.setPreparationStatus(request.preparationStatus());
        if (request.opsNotes() != null) {
            setup.setOpsNotes(request.opsNotes());
        }
        setup.setUpdatedAt(OffsetDateTime.now());
        EventSetup saved = setupRepository.save(setup);
        return toRequestDto(tenantId, inquiry, saved);
    }

    private EventInquiry requireShared(UUID tenantId, UUID inquiryId) {
        EventInquiry inquiry = inquiryRepository.findByIdAndTenantId(inquiryId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event request not found"));
        if (!Boolean.TRUE.equals(inquiry.getBeoSharedWithEvents())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event request not found");
        }
        return inquiry;
    }

    private EventsTeamRequestDto toRequestDto(UUID tenantId, EventInquiry inquiry, EventSetup setup) {
        String hallName = setup != null && setup.getHallId() != null
                ? hallName(tenantId, setup.getHallId()) : null;
        String ownerName = inquiry.getOwnerId() != null
                ? hotelUserRepository.findById(inquiry.getOwnerId()).map(HotelUser::getFullName).orElse(null)
                : null;
        return new EventsTeamRequestDto(
                inquiry.getId(),
                inquiry.getClientName(),
                inquiry.getEventType(),
                setup != null && setup.getEventDate() != null ? setup.getEventDate() : inquiry.getEventDate(),
                hallName,
                setup != null && setup.getGuestCount() != null ? setup.getGuestCount() : inquiry.getGuestCount(),
                setup != null ? setup.getSetupType() : null,
                setup != null && setup.getPreparationStatus() != null ? setup.getPreparationStatus() : "new",
                ownerName,
                setup != null ? setup.getUpdatedAt() : inquiry.getBeoSharedAt()
        );
    }

    private String hallName(UUID tenantId, UUID hallId) {
        return hallRepository.findByIdAndTenantId(hallId, tenantId).map(Hall::getName).orElse(null);
    }

    private List<String> addonNames(UUID tenantId, UUID eventSetupId) {
        List<EventAddon> lines = addonLineRepository.findAllByEventSetupId(eventSetupId);
        if (lines.isEmpty()) {
            return List.of();
        }
        Map<UUID, String> catalog = lines.stream()
                .map(EventAddon::getAddonId)
                .distinct()
                .map(id -> addonRepository.findByIdAndTenantId(id, tenantId).orElse(null))
                .filter(a -> a != null)
                .collect(Collectors.toMap(Addon::getId, Addon::getName));
        return lines.stream()
                .map(line -> catalog.get(line.getAddonId()))
                .filter(name -> name != null)
                .toList();
    }
}