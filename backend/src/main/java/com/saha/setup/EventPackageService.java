package com.saha.setup;

import com.saha.model.EventPackage;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class EventPackageService {

    private static final String STATUS_ACTIVE = "active";
    private static final String STATUS_ARCHIVED = "archived";

    private final EventPackageRepository repository;

    public EventPackageService(EventPackageRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PackageDto> listActive(UUID tenantId) {
        return repository.findAllByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, STATUS_ACTIVE)
                .stream()
                .map(PackageDto::from)
                .toList();
    }

    @Transactional
    public PackageDto create(UUID tenantId, PackageUpsertRequest request) {
        EventPackage pkg = new EventPackage();
        pkg.setId(UUID.randomUUID());
        pkg.setTenantId(tenantId);
        applyRequest(pkg, request);
        pkg.setStatus(STATUS_ACTIVE);
        pkg.setCreatedAt(java.time.OffsetDateTime.now());
        return PackageDto.from(repository.save(pkg));
    }

    @Transactional
    public PackageDto update(UUID tenantId, UUID id, PackageUpsertRequest request) {
        EventPackage pkg = requireOwned(tenantId, id);
        applyRequest(pkg, request);
        return PackageDto.from(repository.save(pkg));
    }

    @Transactional
    public void archive(UUID tenantId, UUID id) {
        EventPackage pkg = requireOwned(tenantId, id);
        pkg.setStatus(STATUS_ARCHIVED);
        repository.save(pkg);
    }

    private EventPackage requireOwned(UUID tenantId, UUID id) {
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
    }

    private void applyRequest(EventPackage pkg, PackageUpsertRequest request) {
        pkg.setName(request.name());
        pkg.setDescription(request.description());
        pkg.setPrice(request.price());
        pkg.setIsTaxable(request.isTaxable());
    }
}
