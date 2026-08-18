package com.saha.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Every request now needs a real, valid Supabase login token — this used to
 * be .anyRequest().permitAll() with nothing checked at all. The chain is:
 *   1. Spring's OAuth2 resource server verifies the token's signature
 *      (against Supabase's public keys) and that it hasn't expired.
 *   2. HotelUserAuthenticationFilter looks the token's email up in our own
 *      hotel_user table and confirms the account is Active.
 *   3. TenantAccessFilter confirms the {tenantId} in the URL actually
 *      belongs to that user (except SAHA_ADMIN, who can reach any tenant).
 *   4. RoleAccessFilter enforces the same per-role rules the frontend guard
 *      already applies, now on the server.
 * Only /api/public/** (customer-facing quote/BEO share links) skips this.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
    private String jwkSetUri;

    private final HotelUserAuthenticationFilter hotelUserAuthenticationFilter;
    private final TenantAccessFilter tenantAccessFilter;
    private final RoleAccessFilter roleAccessFilter;

    public SecurityConfig(HotelUserAuthenticationFilter hotelUserAuthenticationFilter,
                          TenantAccessFilter tenantAccessFilter,
                          RoleAccessFilter roleAccessFilter) {
        this.hotelUserAuthenticationFilter = hotelUserAuthenticationFilter;
        this.tenantAccessFilter = tenantAccessFilter;
        this.roleAccessFilter = roleAccessFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/public/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(jwtDecoder())))
                .addFilterAfter(hotelUserAuthenticationFilter, BearerTokenAuthenticationFilter.class)
                .addFilterAfter(tenantAccessFilter, HotelUserAuthenticationFilter.class)
                .addFilterAfter(roleAccessFilter, TenantAccessFilter.class);
        return http.build();
    }

    /**
     * Supabase signs its tokens with ES256, not the RS256 that Spring
     * assumes by default when you only point it at a jwk-set-uri property —
     * that mismatch caused every token to be rejected with "no matching
     * key(s) found" even though the key itself was found correctly. This
     * bean says explicitly which algorithm to expect.
     */
    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withJwkSetUri(jwkSetUri)
                .jwsAlgorithm(SignatureAlgorithm.ES256)
                .build();
    }

    /** Every real front-end URL that's allowed to call this API. */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:4200",
                "https://startling-cactus-0a064a.netlify.app",
                "https://saha-ksa.com",
                "https://www.saha-ksa.com"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}