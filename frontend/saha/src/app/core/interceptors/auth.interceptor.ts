import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { SupabaseService } from '../services/supabase.service';

/**
 * Attaches the logged-in user's Supabase access token to every request this
 * app makes to its own backend. Without this, the backend's JWT check
 * rejects every request as unauthenticated.
 *
 * Reads the token synchronously from SupabaseService's cached signal —
 * deliberately does NOT call supabase.getSession() (or any other Supabase
 * auth method) here. Doing that would re-enter Supabase's internal auth
 * lock, and if this fires right after another auth call (e.g. the very
 * first API request right after verifyOtp() on login), it can deadlock and
 * freeze the page on "Verifying..." forever.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const supabase = inject(SupabaseService);
  const token = supabase.accessToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq);
};