package com.saha.config;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

/**
 * Replaces the raw "authenticated" Supabase token with one carrying our
 * app's actual role and tenant, once HotelUserAuthenticationFilter has
 * looked the user up. getPrincipal() returns a CurrentUser, not a String.
 */
public class CurrentUserAuthenticationToken extends AbstractAuthenticationToken {

    private final CurrentUser currentUser;

    public CurrentUserAuthenticationToken(CurrentUser currentUser, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.currentUser = currentUser;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return currentUser;
    }
}