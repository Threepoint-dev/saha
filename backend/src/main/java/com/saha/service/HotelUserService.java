package com.saha.service;

import com.saha.model.HotelUser;
import com.saha.repository.HotelUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HotelUserService {

    private final HotelUserRepository hotelUserRepository;

    public List<HotelUser> getAll() {
        return hotelUserRepository.findAll();
    }

    public List<HotelUser> getByTenantId(UUID tenantId) {
        return hotelUserRepository.findByTenantId(tenantId);
    }

    public Optional<HotelUser> getById(UUID id) {
        return hotelUserRepository.findById(id);
    }

    public Optional<HotelUser> getByEmail(String email) {
        return hotelUserRepository.findByEmail(email);
    }

    public HotelUser create(HotelUser hotelUser) {
        if (hotelUserRepository.existsByEmail(hotelUser.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        return hotelUserRepository.save(hotelUser);
    }

    public HotelUser update(UUID id, HotelUser updated) {
        HotelUser existing = hotelUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        existing.setFullName(updated.getFullName());
        existing.setRole(updated.getRole());
        existing.setStatus(updated.getStatus());
        existing.setInviteNote(updated.getInviteNote());
        existing.setInviteExpiresAt(updated.getInviteExpiresAt());
        existing.setLastLoginAt(updated.getLastLoginAt());

        return hotelUserRepository.save(existing);
    }

    public void delete(UUID id) {
        hotelUserRepository.deleteById(id);
    }
}