package com.saha.event;

import com.saha.setup.Addon;
import com.saha.setup.AddonRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class EventAddonService {

    private final EventAddonRepository repository;
    private final EventSetupRepository setupRepository;
    private final EventInquiryRepository inquiryRepository;
    private final AddonRepository addonRepository;

    public EventAddonService(EventAddonRepository repository,
                             EventSetupRepository setupRepository,
                             EventInquiryRepository inquiryRepository,
                             AddonRepository addonRepository) {
        this.repository = repository;
        this.setupRepository = setupRepository;
        this.inquiryRepository = inquiryRepository;
        this.addonRepository = addonRepository;
    }

    @Transactional(readOnly = true)
    public List<EventAddonDto> list(UUID tenantId, UUID eventSetupId) {
        EventSetup setup = requireSetup(tenantId, eventSetupId);
        List<EventAddon> rows = repository.findAllByEventSetupId(setup.getId());
        Map<UUID, Addon> catalog = loadCatalog(tenantId, rows);
        return rows.stream()
                .map(ea -> EventAddonDto.from(ea, catalog.get(ea.getAddonId())))
                .toList();
    }

    @Transactional
    public EventAddonDto add(UUID tenantId, UUID eventSetupId, EventAddonRequest request) {
        EventSetup setup = requireSetup(tenantId, eventSetupId);
        Addon addon = addonRepository.findByIdAndTenantId(request.addonId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Add-on not found"));

        EventAddon ea = new EventAddon();
        ea.setId(UUID.randomUUID());
        ea.setEventSetupId(setup.getId());
        ea.setAddonId(addon.getId());
        ea.setQuantity(request.quantity());
        return EventAddonDto.from(repository.save(ea), addon);
    }

    @Transactional
    public EventAddonDto updateQuantity(UUID tenantId, UUID eventSetupId, UUID eventAddonId,
                                        EventAddonQuantityRequest request) {
        EventSetup setup = requireSetup(tenantId, eventSetupId);
        EventAddon ea = repository.findByIdAndEventSetupId(eventAddonId, setup.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event add-on not found"));
        ea.setQuantity(request.quantity());
        Addon addon = addonRepository.findByIdAndTenantId(ea.getAddonId(), tenantId).orElse(null);
        return EventAddonDto.from(repository.save(ea), addon);
    }

    @Transactional
    public void remove(UUID tenantId, UUID eventSetupId, UUID eventAddonId) {
        EventSetup setup = requireSetup(tenantId, eventSetupId);
        EventAddon ea = repository.findByIdAndEventSetupId(eventAddonId, setup.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event add-on not found"));
        repository.delete(ea);
    }

    private Map<UUID, Addon> loadCatalog(UUID tenantId, List<EventAddon> rows) {
        return rows.stream()
                .map(EventAddon::getAddonId)
                .distinct()
                .map(id -> addonRepository.findByIdAndTenantId(id, tenantId).orElse(null))
                .filter(a -> a != null)
                .collect(Collectors.toMap(Addon::getId, Function.identity()));
    }

    private EventSetup requireSetup(UUID tenantId, UUID eventSetupId) {
        EventSetup setup = setupRepository.findById(eventSetupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event setup not found"));
        // Ownership is inherited from the setup's inquiry, which is tenant-scoped.
        inquiryRepository.findByIdAndTenantId(setup.getInquiryId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event setup not found"));
        return setup;
    }
}
