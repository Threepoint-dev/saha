package com.saha.config;

import com.saha.model.HotelUser;
import com.saha.repository.HotelUserRepository;
import com.saha.setup.SourceChannelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final HotelUserRepository hotelUserRepository;

    private static final String ADMIN_EMAIL = "admin@threepoint.dev";

    @Override
    public void run(ApplicationArguments args) {
        seedAdmin();
    }

    private void seedAdmin() {
        if (!hotelUserRepository.existsByEmail(ADMIN_EMAIL)) {
            HotelUser admin = new HotelUser();
            admin.setEmail(ADMIN_EMAIL);
            admin.setFullName("SAHA Admin");
            admin.setRole("SAHA_ADMIN");
            admin.setStatus("ACTIVE");
            hotelUserRepository.save(admin);
            log.info("✅ SAHA_ADMIN created: {}", ADMIN_EMAIL);
        } else {
            log.info("✅ SAHA_ADMIN already exists: {}", ADMIN_EMAIL);
        }
    }
}