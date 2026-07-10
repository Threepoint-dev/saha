package com.saha.event;

import com.saha.quote.Quote;
import com.saha.quote.QuoteRepository;
import com.saha.setup.Addon;
import com.saha.setup.AddonRepository;
import com.saha.setup.Hall;
import com.saha.setup.HallRepository;
import com.saha.tenant.HotelTenant;
import com.saha.tenant.HotelTenantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class CustomerConfirmationService {

    private static final String STATUS_CONFIRMED = "confirmed";
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final EventInquiryRepository inquiryRepository;
    private final EventSetupRepository setupRepository;
    private final EventAddonRepository addonLineRepository;
    private final AddonRepository addonRepository;
    private final HallRepository hallRepository;
    private final HotelTenantRepository tenantRepository;
    private final QuoteRepository quoteRepository;

    public CustomerConfirmationService(EventInquiryRepository inquiryRepository,
                                       EventSetupRepository setupRepository,
                                       EventAddonRepository addonLineRepository,
                                       AddonRepository addonRepository,
                                       HallRepository hallRepository,
                                       HotelTenantRepository tenantRepository,
                                       QuoteRepository quoteRepository) {
        this.inquiryRepository = inquiryRepository;
        this.setupRepository = setupRepository;
        this.addonLineRepository = addonLineRepository;
        this.addonRepository = addonRepository;
        this.hallRepository = hallRepository;
        this.tenantRepository = tenantRepository;
        this.quoteRepository = quoteRepository;
    }

    @Transactional
    public EventSummaryDto confirm(UUID tenantId, UUID inquiryId) {
        EventInquiry inquiry = inquiryRepository.findByIdAndTenantId(inquiryId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquiry not found"));
        inquiry.setCustomerConfirmedAt(OffsetDateTime.now());
        inquiry.setStatus(STATUS_CONFIRMED);
        inquiryRepository.save(inquiry);
        return buildSummary(inquiry);
    }

    @Transactional(readOnly = true)
    public EventSummaryDto publicSummary(UUID inquiryId) {
        EventInquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        return buildSummary(inquiry);
    }

    private EventSummaryDto buildSummary(EventInquiry inquiry) {
        UUID tenantId = inquiry.getTenantId();
        EventSetup setup = setupRepository.findByInquiryId(inquiry.getId()).orElse(null);

        HotelTenant tenant = tenantId != null ? tenantRepository.findById(tenantId).orElse(null) : null;
        EventSummaryDto.Hotel hotel = tenant == null ? null : new EventSummaryDto.Hotel(
                tenant.getName(),
                tenant.getLogoUrl(),
                tenant.getCity(),
                tenant.getDistrict(),
                tenant.getPhone()
        );

        String hallName = null;
        if (setup != null && setup.getHallId() != null) {
            hallName = hallRepository.findByIdAndTenantId(setup.getHallId(), tenantId)
                    .map(Hall::getName)
                    .orElse(null);
        }

        List<EventSummaryDto.Addon> addons = List.of();
        if (setup != null) {
            addons = addonLineRepository.findAllByEventSetupId(setup.getId()).stream()
                    .map(ea -> new EventSummaryDto.Addon(addonName(tenantId, ea.getAddonId()), ea.getQuantity()))
                    .toList();
        }

        BigDecimal quoteTotal = resolveQuoteTotal(tenantId, inquiry.getId(), setup);

        return new EventSummaryDto(
                hotel,
                inquiry.getClientName(),
                setup != null && setup.getEventDate() != null ? setup.getEventDate() : inquiry.getEventDate(),
                hallName,
                setup != null ? setup.getSetupType() : null,
                setup != null && setup.getGuestCount() != null ? setup.getGuestCount() : inquiry.getGuestCount(),
                setup != null ? setup.getCateringStyle() : null,
                setup != null ? setup.getMainMeal() : null,
                setup != null ? formatTime(setup.getStartTime()) : null,
                setup != null ? formatTime(setup.getEndTime()) : null,
                inquiry.getStatus(),
                inquiry.getCustomerConfirmedAt() != null,
                addons,
                quoteTotal
        );
    }

    private String addonName(UUID tenantId, UUID addonId) {
        return addonRepository.findByIdAndTenantId(addonId, tenantId).map(Addon::getName).orElse(null);
    }

    private BigDecimal resolveQuoteTotal(UUID tenantId, UUID inquiryId, EventSetup setup) {
        if (setup != null && setup.getQuoteId() != null) {
            BigDecimal total = quoteRepository.findByIdAndTenantId(setup.getQuoteId(), tenantId)
                    .map(Quote::getTotal)
                    .orElse(null);
            if (total != null) {
                return total;
            }
        }
        // Fall back to the current quote on the inquiry when no quote is pinned.
        return quoteRepository.findAllByTenantIdAndInquiryId(tenantId, inquiryId).stream()
                .filter(q -> Boolean.TRUE.equals(q.getIsCurrent()))
                .map(Quote::getTotal)
                .findFirst()
                .orElse(null);
    }

    private String formatTime(LocalTime time) {
        return time == null ? null : time.format(TIME_FMT);
    }
}
