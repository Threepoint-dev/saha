package com.saha.tenant;

import com.saha.model.HotelTenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface HotelProfileRepository extends JpaRepository<HotelTenant, UUID> {
}
