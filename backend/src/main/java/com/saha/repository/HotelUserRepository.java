package com.saha.repository;

import com.saha.model.HotelUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HotelUserRepository extends JpaRepository<HotelUser, UUID> {

    Optional<HotelUser> findByEmail(String email);

    List<HotelUser> findByTenantId(UUID tenantId);

    boolean existsByEmail(String email);
}