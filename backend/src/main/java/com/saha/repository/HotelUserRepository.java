package com.saha.repository;

import com.saha.model.HotelUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HotelUserRepository extends JpaRepository<HotelUser, UUID> {

    /** Case-insensitive on purpose — "Admin@Site.com" and "admin@site.com" must be the same account. */
    Optional<HotelUser> findByEmailIgnoreCase(String email);

    List<HotelUser> findByTenantId(UUID tenantId);

    boolean existsByEmailIgnoreCase(String email);
}