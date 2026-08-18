package com.saha.config;

import com.saha.model.HotelUser;
import com.saha.repository.HotelUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Runs right after Spring Security has already verified the Supabase JWT's
 * signature (so we know the token is genuinely from Supabase and hasn't
 * been tampered with). This filter's job is different: it looks up the
 * email from that token in our own hotel_user table, and only lets the
 * request through if that account exists and is Active — the same rule the
 * frontend's login flow already enforces, now enforced here too so it can't
 * be bypassed by calling the API directly.
 *
 * On success, the plain "authenticated" token is replaced with a
 * CurrentUserAuthenticationToken carrying the real role and tenant, which
 * TenantAccessFilter and any controller can then rely on.
 */
@Component
public class HotelUserAuthenticationFilter extends OncePerRequestFilter {

    private final HotelUserRepository hotelUserRepository;

    public HotelUserAuthenticationFilter(HotelUserRepository hotelUserRepository) {
        this.hotelUserRepository = hotelUserRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String email = jwt.getClaimAsString("email");

            Optional<HotelUser> userOpt = email != null
                    ? hotelUserRepository.findByEmailIgnoreCase(email)
                    : Optional.empty();

            if (userOpt.isEmpty() || !"ACTIVE".equals(userOpt.get().getStatus())) {
                sendJsonError(response, HttpServletResponse.SC_FORBIDDEN,
                        "Your account was not found or is not active. Contact your admin.");
                return;
            }

            HotelUser hu = userOpt.get();
            CurrentUser currentUser = new CurrentUser(
                    hu.getId(), hu.getEmail(), hu.getFullName(), hu.getRole(), hu.getTenantId(), hu.getStatus()
            );

            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + hu.getRole()));
            var newAuth = new CurrentUserAuthenticationToken(currentUser, authorities);
            SecurityContextHolder.getContext().setAuthentication(newAuth);
        }

        filterChain.doFilter(request, response);
    }

    private void sendJsonError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}