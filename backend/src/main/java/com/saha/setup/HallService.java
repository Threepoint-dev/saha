package com.saha.setup;

import com.saha.model.Hall;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class HallService {

    private static final String STATUS_ACTIVE = "active";
    private static final String STATUS_ARCHIVED = "archived";

    private final HallRepository repository;

    public HallService(HallRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<HallDto> listActive(UUID tenantId) {
        return repository.findAllByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, STATUS_ACTIVE)
                .stream()
                .map(HallDto::from)
                .toList();
    }

    @Transactional
    public HallDto create(UUID tenantId, HallUpsertRequest request) {
        Hall hall = new Hall();
        hall.setId(UUID.randomUUID());
        hall.setTenantId(tenantId);
        applyRequest(hall, request);
        hall.setStatus(STATUS_ACTIVE);
        OffsetDateTime now = OffsetDateTime.now();
        hall.setCreatedAt(now);
        hall.setUpdatedAt(now);
        return HallDto.from(repository.save(hall));
    }

    @Transactional
    public HallDto update(UUID tenantId, UUID id, HallUpsertRequest request) {
        Hall hall = requireOwned(tenantId, id);
        applyRequest(hall, request);
        hall.setUpdatedAt(OffsetDateTime.now());
        return HallDto.from(repository.save(hall));
    }

    @Transactional
    public void archive(UUID tenantId, UUID id) {
        Hall hall = requireOwned(tenantId, id);
        hall.setStatus(STATUS_ARCHIVED);
        hall.setUpdatedAt(OffsetDateTime.now());
        repository.save(hall);
    }

    private Hall requireOwned(UUID tenantId, UUID id) {
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hall not found"));
    }

    private void applyRequest(Hall hall, HallUpsertRequest request) {
        hall.setName(request.name());
        hall.setCapacity(request.capacity());
        hall.setBasePrice(request.basePrice());
        hall.setDefaultSetup(request.defaultSetup());
        hall.setShortCode(request.shortCode());
    }
}
