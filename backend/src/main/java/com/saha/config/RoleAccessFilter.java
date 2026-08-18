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
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Enforces the same role rules the frontend's route guard already applies —
 * now on the server, where they can't be bypassed by calling the API
 * directly instead of clicking through the UI. Runs after
 * HotelUserAuthenticationFilter and TenantAccessFilter, so CurrentUser and
 * tenant ownership are already confirmed by the time this checks role.
 *
 * Rules are checked in order; the first matching rule decides. A request
 * that matches no rule here is allowed through (already authenticated and
 * tenant-checked by the earlier filters) — this file only adds the extra,
 * clearly-defined role restrictions, rather than trying to enumerate every
 * endpoint in the app.
 */
@Component
public class RoleAccessFilter extends OncePerRequestFilter {

    private record Rule(Pattern path, Set<String> methods, Set<String> allowedRoles) {
        boolean matches(String uri, String method) {
            return path.matcher(uri).find() && (methods.isEmpty() || methods.contains(method));
        }
    }

    private static final Set<String> ANY_METHOD = Set.of();
    private static final Set<String> WRITE_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final List<Rule> rules = List.of(
            // Events Team's own workspace — never reachable by Sales roles, and vice versa.
            new Rule(Pattern.compile("/api/tenants/[^/]+/events-team/"), ANY_METHOD,
                    Set.of("EVENTS_TEAM", "EVENTS_DIRECTOR", "SAHA_ADMIN")),

            // Sales workflow (inquiries, quotes, event setup) — Events Team never touches this directly;
            // they only see what's been deliberately shared through events-team/requests.
            new Rule(Pattern.compile("/api/tenants/[^/]+/(inquiries|quotes)(/|$)"), ANY_METHOD,
                    Set.of("SAHA_ADMIN", "DIRECTOR_OF_SALES", "SALES_REP")),

            // Reporting & export — operational roles (Sales Rep, Events Team) don't need or get this.
            new Rule(Pattern.compile("/api/tenants/[^/]+/(reports|export)(/|$)"), ANY_METHOD,
                    Set.of("SAHA_ADMIN", "DIRECTOR_OF_SALES", "EVENTS_DIRECTOR")),

            // Setup reference data (halls/packages/add-ons/source channels/quote settings) —
            // anyone can read (Sales Rep needs the halls list to log an inquiry), but only
            // Director of Sales / Admin can change it.
            new Rule(Pattern.compile("/api/tenants/[^/]+/(halls|addons|packages|source-channels|quote-settings)"),
                    WRITE_METHODS, Set.of("SAHA_ADMIN", "DIRECTOR_OF_SALES")),

            // Managing hotel users (invite/edit/deactivate) — same two roles as the Setup pages.
            new Rule(Pattern.compile("/api/users(/|$)"), WRITE_METHODS,
                    Set.of("SAHA_ADMIN", "DIRECTOR_OF_SALES")),

            // Creating or listing hotel tenants — SAHA_ADMIN only; this is the platform operator's
            // own console, not something any hotel-side role should ever reach.
            new Rule(Pattern.compile("^/api/tenants/?$"), ANY_METHOD, Set.of("SAHA_ADMIN"))
    );

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth != null ? auth.getPrincipal() : null;

        if (principal instanceof CurrentUser currentUser) {
            String uri = request.getRequestURI();
            String method = request.getMethod();

            for (Rule rule : rules) {
                if (rule.matches(uri, method)) {
                    if (!rule.allowedRoles().contains(currentUser.role())) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"message\":\"Your role doesn't have access to this.\"}");
                        return;
                    }
                    break; // first matching rule decides — don't keep checking further rules
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}