package com.saha.tenant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateHotelProfileRequest(
        @NotBlank @Size(max = 255) String name,
        String address,
        @Size(max = 255) String city,
        @Size(max = 255) String district,
        @Size(max = 255) String phone,
        @Size(max = 255) String mainContactName,
        @Email @Size(max = 255) String mainContactEmail,
        @Size(max = 255) String mainContactPhone,
        @Size(max = 500) String logoUrl,
        String quoteFooterText,
        String termsNotes,
        Boolean isActive
) {
}
