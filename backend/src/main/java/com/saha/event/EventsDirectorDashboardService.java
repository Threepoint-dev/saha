package com.saha.event;

import com.saha.model.EventSetup;
import com.saha.model.Hall;
import com.saha.model.HallAvailability;
import com.saha.model.Quote;
import com.saha.quote.QuoteRepository;
import com.saha.repository.HallAvailabilityRepository;
import com.saha.setup.HallRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Events Director Dashboard (EP-08). Rolls up hall load (from the availability
 * calendar), preparation progress (from event setups), and estimated revenue
 * value (from linked quotes) for one tenant.
 */
@Service
public class EventsDirectorDashboardService {

    private final EventInquiryRepository inquiryRepository;
    private final EventSetupRepository setupRepository;
    private final HallAvailabilityRepository availabilityRepository;
    private final HallRepository hallRepository;
    private final QuoteRepository quoteRepository;

    public EventsDirectorDashboardService(EventInquiryRepository inquiryRepository,
                                          EventSetupRepository setupRepository,
                                          HallAvailabilityRepository availabilityRepository,
                                          HallRepository hallRepository,
                                          QuoteRepository quoteRepository) {
        this.inquiryRepository = inquiryRepository;
        this.setupRepository = setupRepository;
        this.availabilityRepository = availabilityRepository;
        this.hallRepository = hallRepository;
        this.quoteRepository = quoteRepository;
    }

    @Transactional(readOnly = true)
    public EventsDirectorDashboardDto getDashboard(UUID tenantId) {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);

        List<UUID> inquiryIds = inquiryRepository.findAllByTenantId(tenantId).stream()
                .map(EventInquiry::getId)
                .toList();
        List<EventSetup> setups = inquiryIds.isEmpty()
                ? List.of()
                : setupRepository.findAllByInquiryIdIn(inquiryIds);

        int total = countInRange(setups, monthStart, monthEnd);
        int prepared = (int) setups.stream().filter(s -> "prepared".equals(s.getPreparationStatus())).count();
        int upcoming = countInRange(setups, today, today.plusDays(30));

        List<HallAvailability> blocks =
                availabilityRepository.findAllByTenantIdAndEventDateBetweenOrderByEventDateAsc(tenantId, monthStart, monthEnd);
        int confirmedCount = (int) blocks.stream().filter(b -> "confirmed".equals(b.getStatus())).count();
        int tentativeCount = (int) blocks.stream().filter(b -> "tentative".equals(b.getStatus())).count();

        BigDecimal confirmedValue = blocks.stream()
                .filter(b -> "confirmed".equals(b.getStatus()) && b.getInquiryId() != null)
                .map(b -> quoteTotalForInquiry(tenantId, b.getInquiryId(), setups))
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<EventsDirectorDashboardDto.HallRevenue> revenueByHall = buildRevenueByHall(tenantId, setups);
        List<EventsDirectorDashboardDto.SetupTypeCount> requestsBySetupType = buildSetupTypeCounts(setups);
        List<EventsDirectorDashboardDto.MonthCount> monthlyTrend = buildMonthlyTrend(setups, monthStart);

        return new EventsDirectorDashboardDto(
                total, confirmedCount, confirmedValue, tentativeCount, prepared, upcoming,
                revenueByHall, requestsBySetupType, monthlyTrend
        );
    }

    private int countInRange(List<EventSetup> setups, LocalDate from, LocalDate to) {
        return (int) setups.stream()
                .filter(s -> s.getEventDate() != null && !s.getEventDate().isBefore(from) && !s.getEventDate().isAfter(to))
                .count();
    }

    private BigDecimal quoteTotalForInquiry(UUID tenantId, UUID inquiryId, List<EventSetup> setups) {
        return setups.stream()
                .filter(s -> inquiryId.equals(s.getInquiryId()) && s.getQuoteId() != null)
                .findFirst()
                .flatMap(s -> quoteRepository.findByIdAndTenantId(s.getQuoteId(), tenantId))
                .map(Quote::getTotal)
                .orElse(null);
    }

    private List<EventsDirectorDashboardDto.HallRevenue> buildRevenueByHall(UUID tenantId, List<EventSetup> setups) {
        Map<UUID, String> hallNames = setups.stream()
                .map(EventSetup::getHallId)
                .filter(id -> id != null)
                .distinct()
                .map(id -> hallRepository.findByIdAndTenantId(id, tenantId).orElse(null))
                .filter(h -> h != null)
                .collect(Collectors.toMap(Hall::getId, Hall::getName));

        Map<String, BigDecimal> revenue = new LinkedHashMap<>();
        for (EventSetup s : setups) {
            if (s.getQuoteId() == null || s.getHallId() == null) continue;
            BigDecimal value = quoteRepository.findByIdAndTenantId(s.getQuoteId(), tenantId).map(Quote::getTotal).orElse(null);
            if (value == null) continue;
            String hallName = hallNames.getOrDefault(s.getHallId(), "Unknown hall");
            revenue.merge(hallName, value, BigDecimal::add);
        }
        return revenue.entrySet().stream()
                .map(e -> new EventsDirectorDashboardDto.HallRevenue(e.getKey(), e.getValue()))
                .sorted((a, b) -> b.valueSar().compareTo(a.valueSar()))
                .toList();
    }

    private List<EventsDirectorDashboardDto.SetupTypeCount> buildSetupTypeCounts(List<EventSetup> setups) {
        Map<String, Long> counts = setups.stream()
                .filter(s -> s.getSetupType() != null)
                .collect(Collectors.groupingBy(EventSetup::getSetupType, Collectors.counting()));
        return counts.entrySet().stream()
                .map(e -> new EventsDirectorDashboardDto.SetupTypeCount(e.getKey(), e.getValue().intValue()))
                .sorted((a, b) -> b.count() - a.count())
                .toList();
    }

    private List<EventsDirectorDashboardDto.MonthCount> buildMonthlyTrend(List<EventSetup> setups, LocalDate monthStart) {
        List<EventsDirectorDashboardDto.MonthCount> trend = new ArrayList<>();
        for (int i = 3; i >= 0; i--) {
            LocalDate m = monthStart.minusMonths(i);
            LocalDate mEnd = m.plusMonths(1).minusDays(1);
            int count = countInRange(setups, m, mEnd);
            String label = m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            trend.add(new EventsDirectorDashboardDto.MonthCount(label, count));
        }
        return trend;
    }
}