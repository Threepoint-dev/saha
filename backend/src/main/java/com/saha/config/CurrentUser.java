package com.saha.config;

import java.util.UUID;

/**
 * The real, logged-in user for this request — resolved by
 * HotelUserAuthenticationFilter after Supabase's JWT signature has already
 * been verified. Everything downstream (TenantAccessFilter, controllers)
 * trusts this instead of anything the client claims in the URL or body.
 */
public record CurrentUser(
        UUID id,
        String email,
        String fullName,
        String role,
        UUID tenantId,
        String status
) {
}