package com.saha.setup;

import com.saha.model.HotelTenant;
import com.saha.tenant.HotelProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Computes the pilot readiness checklist for a tenant and derives the overall
 * readiness status from it. The derived status is written through to
 * {@code hotel_tenant.readiness_status} so the stored column stays in sync,
 * except for {@code Ready for Live} which is a terminal state promoted manually
 * once the baseline period is complete (baseline completion is outside the
 * auto-checked setup items).
 */
@Service
public class ReadinessService {

    // Readiness levels, in order.
    static final String NOT_READY = "Not Ready";
    static final String ALMOST_READY = "Almost Ready";
    static final String READY_FOR_BASELINE = "Ready for Baseline";
    static final String READY_FOR_LIVE = "Ready for Live";

    private static final String STATUS_ACTIVE = "active";

    private final HotelProfileRepository tenantRepository;
    private final HallRepository hallRepository;
    private final EventPackageRepository packageRepository;
    private final SourceChannelRepository sourceChannelRepository;
    private final QuoteSettingsRepository quoteSettingsRepository;

    public ReadinessService(HotelProfileRepository tenantRepository,
                            HallRepository hallRepository,
                            EventPackageRepository packageRepository,
                            SourceChannelRepository sourceChannelRepository,
                            QuoteSettingsRepository quoteSettingsRepository) {
        this.tenantRepository = tenantRepository;
        this.hallRepository = hallRepository;
        this.packageRepository = packageRepository;
        this.sourceChannelRepository = sourceChannelRepository;
        this.quoteSettingsRepository = quoteSettingsRepository;
    }

    @Transactional
    public ReadinessDto getReadiness(UUID tenantId) {
        HotelTenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found"));

        boolean hotelProfileComplete = hasText(tenant.getName())
                && hasText(tenant.getPhone())
                && hasText(tenant.getAddress());
        boolean hasHalls = hallRepository.existsByTenantIdAndStatus(tenantId, STATUS_ACTIVE);
        boolean hasPackages = packageRepository.existsByTenantIdAndStatus(tenantId, STATUS_ACTIVE);
        boolean hasSourceChannels = sourceChannelRepository.existsByTenantIdAndIsActiveTrue(tenantId);
        boolean quoteSettingsConfigured = quoteSettingsRepository.existsByTenantId(tenantId);

        List<ReadinessChecklistItem> checklist = List.of(
                new ReadinessChecklistItem("hotel_profile_complete", "Hotel profile complete", hotelProfileComplete),
                new ReadinessChecklistItem("has_halls", "At least one active hall", hasHalls),
                new ReadinessChecklistItem("has_packages", "At least one active package", hasPackages),
                new ReadinessChecklistItem("has_source_channels", "At least one active source channel", hasSourceChannels),
                new ReadinessChecklistItem("quote_settings_configured", "Quote settings configured", quoteSettingsConfigured)
        );

        String status = deriveStatus(checklist, tenant.getReadinessStatus());

        // Write through so the stored column reflects the current setup state.
        if (!status.equals(tenant.getReadinessStatus())) {
            tenant.setReadinessStatus(status);
            tenantRepository.save(tenant);
        }

        return new ReadinessDto(status, checklist);
    }

    /**
     * Derives the overall readiness status from the checklist.
     *
     * <ul>
     *   <li>{@code Ready for Live} is terminal — once set (after baseline), it is preserved.</li>
     *   <li>Missing the critical hotel profile ⇒ {@code Not Ready}.</li>
     *   <li>Every item done ⇒ {@code Ready for Baseline}.</li>
     *   <li>Otherwise (profile done, some gaps) ⇒ {@code Almost Ready}.</li>
     * </ul>
     */
    private String deriveStatus(List<ReadinessChecklistItem> checklist, String currentStatus) {
        if (READY_FOR_LIVE.equals(currentStatus)) {
            return READY_FOR_LIVE;
        }
        boolean hotelProfileComplete = checklist.stream()
                .filter(item -> "hotel_profile_complete".equals(item.key()))
                .findFirst()
                .map(ReadinessChecklistItem::done)
                .orElse(false);
        if (!hotelProfileComplete) {
            return NOT_READY;
        }
        boolean allDone = checklist.stream().allMatch(ReadinessChecklistItem::done);
        return allDone ? READY_FOR_BASELINE : ALMOST_READY;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
