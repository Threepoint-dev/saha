package com.saha.tenant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface HotelTenantRepository extends JpaRepository<HotelTenant, UUID> {
}
