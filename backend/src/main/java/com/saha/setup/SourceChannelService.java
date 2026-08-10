package com.saha.setup;

import com.saha.model.SourceChannel;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SourceChannelService {

    private static final List<String> DEFAULT_CHANNELS =
            List.of("Phone", "Email", "WhatsApp", "Walk-in", "Referral", "Other");

    private final SourceChannelRepository repository;

    public SourceChannelService(SourceChannelRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public List<SourceChannelDto> list(UUID tenantId) {
        if (!repository.existsByTenantId(tenantId)) {
            seedDefaults(tenantId);
        }
        return repository.findAllByTenantIdOrderBySortOrderAscCreatedAtAsc(tenantId)
                .stream()
                .map(SourceChannelDto::from)
                .toList();
    }

    @Transactional
    public SourceChannelDto create(UUID tenantId, SourceChannelUpsertRequest request) {
        SourceChannel channel = new SourceChannel();
        channel.setTenantId(tenantId);
        channel.setName(request.name());
        channel.setIsActive(request.isActive() == null ? Boolean.TRUE : request.isActive());
        channel.setSortOrder(request.sortOrder() == null ? nextSortOrder(tenantId) : request.sortOrder());
        channel.setCreatedAt(OffsetDateTime.now());
        return SourceChannelDto.from(repository.save(channel));
    }

    @Transactional
    public SourceChannelDto update(UUID tenantId, UUID id, SourceChannelUpsertRequest request) {
        SourceChannel channel = requireOwned(tenantId, id);
        channel.setName(request.name());
        if (request.isActive() != null) {
            channel.setIsActive(request.isActive());
        }
        if (request.sortOrder() != null) {
            channel.setSortOrder(request.sortOrder());
        }
        return SourceChannelDto.from(repository.save(channel));
    }

    @Transactional
    public void delete(UUID tenantId, UUID id) {
        SourceChannel channel = requireOwned(tenantId, id);
        try {
            repository.delete(channel);
            repository.flush();
        } catch (DataIntegrityViolationException ex) {
            channel.setIsActive(Boolean.FALSE);
            repository.save(channel);
        }
    }

    private SourceChannel requireOwned(UUID tenantId, UUID id) {
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Source channel not found"));
    }

    private int nextSortOrder(UUID tenantId) {
        return repository.findAllByTenantIdOrderBySortOrderAscCreatedAtAsc(tenantId)
                .stream()
                .map(SourceChannel::getSortOrder)
                .filter(order -> order != null)
                .max(Integer::compareTo)
                .map(max -> max + 1)
                .orElse(0);
    }

    private void seedDefaults(UUID tenantId) {
        OffsetDateTime now = OffsetDateTime.now();
        int order = 0;
        for (String name : DEFAULT_CHANNELS) {
            SourceChannel channel = new SourceChannel();
            channel.setTenantId(tenantId);
            channel.setName(name);
            channel.setIsActive(Boolean.TRUE);
            channel.setSortOrder(order++);
            channel.setCreatedAt(now);
            repository.save(channel);
        }
    }
}