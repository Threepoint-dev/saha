package com.saha.setup;

import com.saha.model.Addon;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AddonService {

    private static final String STATUS_ACTIVE = "active";
    private static final String STATUS_ARCHIVED = "archived";

    private final AddonRepository repository;

    public AddonService(AddonRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AddonDto> listActive(UUID tenantId) {
        return repository.findAllByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, STATUS_ACTIVE)
                .stream()
                .map(AddonDto::from)
                .toList();
    }

    @Transactional
    public AddonDto create(UUID tenantId, AddonUpsertRequest request) {
        Addon addon = new Addon();
        addon.setTenantId(tenantId);
        applyRequest(addon, request);
        addon.setStatus(STATUS_ACTIVE);
        addon.setCreatedAt(OffsetDateTime.now());
        return AddonDto.from(repository.save(addon));
    }

    @Transactional
    public AddonDto update(UUID tenantId, UUID id, AddonUpsertRequest request) {
        Addon addon = requireOwned(tenantId, id);
        applyRequest(addon, request);
        return AddonDto.from(repository.save(addon));
    }

    @Transactional
    public void archive(UUID tenantId, UUID id) {
        Addon addon = requireOwned(tenantId, id);
        addon.setStatus(STATUS_ARCHIVED);
        repository.save(addon);
    }

    private Addon requireOwned(UUID tenantId, UUID id) {
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Add-on not found"));
    }

    private void applyRequest(Addon addon, AddonUpsertRequest request) {
        addon.setName(request.name());
        addon.setPrice(request.price());
        addon.setIsTaxable(request.isTaxable());
    }
}