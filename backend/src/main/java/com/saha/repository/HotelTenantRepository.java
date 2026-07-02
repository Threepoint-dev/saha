package com.saha.repository;

import com.saha.model.HotelTenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface HotelTenantRepository extends JpaRepository<HotelTenant, UUID> {

    boolean existsByName(String name);
}