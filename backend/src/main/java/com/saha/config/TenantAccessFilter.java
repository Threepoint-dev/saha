package com.saha.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The core "Hotel A can never touch Hotel B's data" guarantee. Almost every
 * endpoint is shaped /api/tenants/{tenantId}/..., and until now the backend
 * blindly trusted whatever tenantId the caller put in the URL. This filter
 * checks that the {tenantId} in the URL actually matches the logged-in
 * user's own tenant, and rejects the request otherwise.
 *
 * SAHA_ADMIN is exempt — the platform operator legitimately needs to reach
 * any hotel's data (Admin console, cross-hotel reporting).
 */
@Component
public class TenantAccessFilter extends OncePerRequestFilter {

    private static final Pattern TENANT_PATH = Pattern.compile("/api/tenants/([0-9a-fA-F-]{36})(/.*)?");

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        Matcher matcher = TENANT_PATH.matcher(request.getRequestURI());

        if (matcher.matches()) {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            Object principal = auth != null ? auth.getPrincipal() : null;

            if (principal instanceof CurrentUser currentUser) {
                String pathTenantId = matcher.group(1);
                boolean isSahaAdmin = "SAHA_ADMIN".equals(currentUser.role());

                if (!isSahaAdmin && !pathTenantId.equalsIgnoreCase(currentUser.tenantId().toString())) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"message\":\"You don't have access to this hotel's data.\"}");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}